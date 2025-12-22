"use client";

import React, { useState, useEffect } from "react";
import { 
  Bell, 
  AlertTriangle, 
  Info, 
  CheckCircle, 
  Package, 
  Calendar,
  RefreshCw,
  Loader,
  Trash2,
  Eye,
  EyeOff
} from "lucide-react";
import { useAuth } from "@/hooks/auth";
import { getMedicines } from "@/helper/inventory";
import { getExpenses } from "@/helper/expenses";
import { collection, addDoc, query, where, getDocs, doc, updateDoc, deleteDoc, Timestamp } from "firebase/firestore";
import { db } from "@/firebase/config";

// Notification types configuration
const typeConfig = {
  Alert: { 
    icon: AlertTriangle, 
    color: "text-red-700",
    bgColor: "bg-red-50",
    borderColor: "border-red-200"
  },
  Info: { 
    icon: Info, 
    color: "text-blue-700",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200"
  },
  Warning: { 
    icon: AlertTriangle, 
    color: "text-yellow-700",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-200"
  },
  Success: { 
    icon: CheckCircle, 
    color: "text-green-700",
    bgColor: "bg-green-50",
    borderColor: "border-green-200"
  },
  Stock: { 
    icon: Package, 
    color: "text-orange-700",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200"
  },
  Expiry: { 
    icon: Calendar, 
    color: "text-purple-700",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200"
  }
};

export default function NotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [filterType, setFilterType] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [showRead, setShowRead] = useState(true);

  // Fetch notifications from Firestore
  const fetchNotifications = async () => {
    if (!user) return;
    
    setLoading(true);
    setError("");
    
    try {
      const notificationsRef = collection(db, "notifications");
      const q = query(
        notificationsRef,
        where("userId", "==", user.uid)
      );
      
      const querySnapshot = await getDocs(q);
      const notificationList = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        notificationList.push({
          id: doc.id,
          ...data,
          date: data.createdAt?.toDate?.()?.toLocaleDateString('rw-RW') || "Nta makuru"
        });
      });

      // Sort by date (newest first)
      notificationList.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(0);
        const dateB = b.createdAt?.toDate?.() || new Date(0);
        return dateB.getTime() - dateA.getTime();
      });

      // If no notifications, create welcome notification
      if (notificationList.length === 0) {
        await createWelcomeNotification();
        return fetchNotifications(); // Fetch again
      }

      setNotifications(notificationList);
      const unread = notificationList.filter(n => !n.read).length;
      setUnreadCount(unread);
      
    } catch (err) {
      console.error("Error fetching notifications:", err);
      
      if (err.code === 'failed-precondition') {
        setError("Sisitemu iracyakorwa amakuru. Gerageza nanone mu minsi 2.");
      } else {
        setError("Habaye ikosa mu kuzana amakuru.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Create welcome notification for new users
  const createWelcomeNotification = async () => {
    if (!user) return;
    
    try {
      const notificationsRef = collection(db, "notifications");
      
      await addDoc(notificationsRef, {
        userId: user.uid,
        type: "Success",
        message: "Murakaza neza muri Pharmacy Management System!",
        details: "Tangira gukoresha sisitemu yo gutunganya imiti, amafaranga, n'ibindi bikorwa bya pharmacy.",
        priority: "low",
        read: false,
        createdAt: Timestamp.now(),
        source: "system"
      });
      
      // Also generate system alerts based on current data
      await generateSystemAlerts();
      
    } catch (err) {
      console.error("Error creating welcome notification:", err);
    }
  };

  // Generate system alerts from inventory and expenses
  const generateSystemAlerts = async () => {
    if (!user) return;
    
    try {
      const today = new Date();
      
      // Check medicines for alerts
      const medicinesResult = await getMedicines(user.uid);
      if (medicinesResult.success && medicinesResult.data) {
        for (const medicine of medicinesResult.data) {
          if (!medicine.expiry) continue;
          
          try {
            const expiryDate = new Date(medicine.expiry);
            if (isNaN(expiryDate.getTime())) continue;
            
            const timeDiff = expiryDate.getTime() - today.getTime();
            const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));
            
            // Expired medicine alert
            if (daysLeft <= 0) {
              await addDoc(collection(db, "notifications"), {
                userId: user.uid,
                type: "Alert",
                message: `${medicine.name} yararengeje igihe!`,
                details: `Igihe cyarangije: ${expiryDate.toLocaleDateString('rw-RW')}. Irabura: ${medicine.quantity}`,
                priority: "high",
                read: false,
                createdAt: Timestamp.now(),
                source: "inventory"
              });
            } 
            // Near expiry warning (7 days or less)
            else if (daysLeft <= 7) {
              await addDoc(collection(db, "notifications"), {
                userId: user.uid,
                type: "Expiry",
                message: `${medicine.name} izarangira mu minsi ${daysLeft}`,
                details: `Itariki yo kurangirira: ${expiryDate.toLocaleDateString('rw-RW')}`,
                priority: "medium",
                read: false,
                createdAt: Timestamp.now(),
                source: "inventory"
              });
            }
            
            // Low stock alert
            const minStock = medicine.minStock || 10;
            if (medicine.quantity < minStock) {
              await addDoc(collection(db, "notifications"), {
                userId: user.uid,
                type: "Stock",
                message: `${medicine.name} irabura!`,
                details: `Irabura: ${medicine.quantity}, Igiteranyo cy'ibanze: ${minStock}`,
                priority: "medium",
                read: false,
                createdAt: Timestamp.now(),
                source: "inventory"
              });
            }
          } catch (err) {
            console.error("Error processing medicine:", err);
          }
        }
      }
      
      // Check expenses (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const expensesResult = await getExpenses(user.uid, { 
        fromDate: thirtyDaysAgo.toISOString().split('T')[0] 
      });
      
      if (expensesResult.success && expensesResult.data && expensesResult.data.length > 0) {
        const totalExpenses = expensesResult.data.reduce((sum, exp) => sum + (exp.amount || 0), 0);
        
        // High expense alert
        if (totalExpenses > 1000000) {
          await addDoc(collection(db, "notifications"), {
            userId: user.uid,
            type: "Warning",
            message: "Amafaranga yatanzwe yarushije 1,000,000 RWF mu mezi 2 ishize",
            details: `Igiteranyo: ${totalExpenses.toLocaleString()} RWF`,
            priority: "low",
            read: false,
            createdAt: Timestamp.now(),
            source: "expenses"
          });
        }
      }
      
    } catch (err) {
      console.error("Error generating system alerts:", err);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      const notificationRef = doc(db, "notifications", notificationId);
      await updateDoc(notificationRef, { read: true });
      
      setNotifications(prev => prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Error marking as read:", err);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    if (!user) return;
    
    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      
      for (const notification of unreadNotifications) {
        const notificationRef = doc(db, "notifications", notification.id);
        await updateDoc(notificationRef, { read: true });
      }
      
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Error marking all as read:", err);
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId) => {
    if (!confirm("Urifuza gusiba iyi nyandiko?")) return;
    
    try {
      const notificationRef = doc(db, "notifications", notificationId);
      await deleteDoc(notificationRef);
      
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      // Update unread count
      const deletedNotification = notifications.find(n => n.id === notificationId);
      if (deletedNotification && !deletedNotification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error("Error deleting notification:", err);
    }
  };

  // Refresh notifications
  const refreshNotifications = async () => {
    await generateSystemAlerts();
    await fetchNotifications();
  };

  // Filter notifications
  const filteredNotifications = notifications.filter(n => {
    if (filterType !== "All" && n.type !== filterType) return false;
    if (!showRead && n.read) return false;
    return true;
  });

  // Calculate notification counts by type
  const getNotificationCount = (type) => {
    if (type === "All") return notifications.length;
    return notifications.filter(n => n.type === type).length;
  };

  // Fetch notifications on component mount
  useEffect(() => {
    if (!authLoading && user) {
      fetchNotifications();
    }
  }, [authLoading, user]);

  if (authLoading) {
    return (
      <div className="flex-1 p-4 md:p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-purple-600 mx-auto" />
          <p className="mt-2 text-sm text-gray-600">Irazana amakuru...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex-1 p-4 md:p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Ntabwo wemewe</h2>
          <p className="text-gray-600">Injira kugirango urebe amakuru</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 md:p-6 bg-gray-50 min-h-screen space-y-4">
      {/* Header */}
      <header className="mb-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Bell size={20} className="text-purple-600" />
              </div>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">Amakuru</h1>
              <p className="text-sm text-gray-600 mt-1">
                Reba amakuru yose y'ingenzi n'amakuru y'ibikorwa bya buri munsi
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={refreshNotifications}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              {loading ? "Iracyakora..." : "Ongera Uzane"}
            </button>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                <Eye size={14} />
                Soma Byose
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-3 rounded-lg shadow-sm">
          <div className="text-xs text-gray-500">Amakuru yose</div>
          <div className="text-lg font-bold text-gray-900">{notifications.length}</div>
        </div>
        <div className="bg-white p-3 rounded-lg shadow-sm">
          <div className="text-xs text-gray-500">Amakuru atarasomwa</div>
          <div className="text-lg font-bold text-red-600">{unreadCount}</div>
        </div>
        <div className="bg-white p-3 rounded-lg shadow-sm">
          <div className="text-xs text-gray-500">Ibyitonderwa</div>
          <div className="text-lg font-bold text-yellow-600">
            {notifications.filter(n => n.type === "Alert").length}
          </div>
        </div>
        <div className="bg-white p-3 rounded-lg shadow-sm">
          <div className="text-xs text-gray-500">Imiti</div>
          <div className="text-lg font-bold text-purple-600">
            {notifications.filter(n => n.type === "Expiry" || n.type === "Stock").length}
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white rounded-xl shadow-sm p-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex gap-2 overflow-x-auto">
            {["All", "Alert", "Expiry", "Stock", "Info", "Success"].map(type => {
              const config = typeConfig[type] || typeConfig.Info;
              const Icon = config.icon;
              const count = getNotificationCount(type);
              
              if (count === 0 && type !== "All") return null;
              
              return (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition whitespace-nowrap ${
                    filterType === type
                      ? `${config.bgColor} ${config.color}`
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <Icon size={14} />
                  {type} ({count})
                </button>
              );
            })}
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setShowRead(!showRead)}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg ${
                showRead 
                  ? "bg-blue-100 text-blue-700" 
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {showRead ? <Eye size={14} /> : <EyeOff size={14} />}
              {showRead ? "Yasomwe" : "Ntasomwe"}
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3">
          <div className="flex items-center gap-2 text-red-700 text-sm">
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <Loader className="w-8 h-8 animate-spin text-purple-600 mx-auto" />
          <p className="mt-2 text-sm text-gray-600">Amakuru arazanwa...</p>
        </div>
      )}

      {/* Notification List */}
      {!loading && (
        <div className="space-y-3">
          {filteredNotifications.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-8 text-center">
              <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-base font-medium text-gray-700 mb-2">
                Nta makuru ahari
              </h3>
              <p className="text-sm text-gray-500">
                {filterType === "All" 
                  ? "Nta makuru ahari kugeza ubu. Amakuru azagaragara habanza utangira gukoresha sisitemu."
                  : "Nta makuru ya ayo moko ahari kugeza ubu."
                }
              </p>
            </div>
          ) : (
            filteredNotifications.map((notification) => {
              const config = typeConfig[notification.type] || typeConfig.Info;
              const Icon = config.icon;
              
              return (
                <div
                  key={notification.id}
                  className={`bg-white rounded-xl shadow-sm p-3 border-l-4 ${config.borderColor} hover:shadow-md transition`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${config.bgColor}`}>
                      <Icon size={18} className={config.color} />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-800">{notification.message}</p>
                          {notification.details && (
                            <p className="text-sm text-gray-600 mt-1">{notification.details}</p>
                          )}
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-xs text-gray-500">
                              {notification.date}
                            </span>
                            {notification.source && (
                              <span className="text-xs text-gray-400">
                                • {notification.source === "inventory" ? "Imiti" : 
                                   notification.source === "expenses" ? "Amafaranga" : 
                                   "Sisitemu"}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex gap-1">
                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                              title="Soma"
                            >
                              <Eye size={16} />
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                            title="Siba"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      
                      {!notification.read && (
                        <div className="mt-2">
                          <span className="inline-block w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                          <span className="text-xs text-blue-600 ml-2">Amakuru mashya</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Help Section */}
      <div className="mt-4 p-3 bg-gray-50 rounded-xl border border-gray-200">
        <h4 className="font-medium text-gray-800 text-sm mb-2">Ubwoko bw'amakuru:</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span><strong>Ibyitonderwa:</strong> Imiti yarengeje igihe</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <span><strong>Imiti:</strong> Imiti izarangira vuba</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
            <span><strong>Irabura:</strong> Imiti ifite umubare make</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span><strong>Ibyiza:</strong> Amakuru meza n'ibindi</span>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Sisitemu ikora amakuru mu buryo bwikora haba ku miti yarengeje, 
          irabura, amafaranga yatanzwe, n'ibindi bikorwa by'ingenzi.
        </p>
      </div>
    </div>
  );
}