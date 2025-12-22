"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Phone, Mail, AlertTriangle, CheckCircle, Loader, Shield, Clock } from 'lucide-react';
import { useAuth } from '@/hooks/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase/config';

const SubscriptionExpPage = () => {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState('');

  // Listen for subscription updates in real-time
  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    const unsubscribe = onSnapshot(doc(db, 'subscriptions', user.uid), 
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          setSubscriptionData(data);
          
          // Check if subscription is still active
          if (data.status === 'active' && data.expiryDate) {
            const expiryDate = new Date(data.expiryDate);
            const now = new Date();
            
            if (expiryDate > now) {
              // Subscription is still valid, redirect to dashboard
              setTimeout(() => {
                router.push('/dashboard');
              }, 2000);
            }
          }
          
          // Calculate time remaining
          if (data.expiryDate) {
            const expiryDate = new Date(data.expiryDate);
            const now = new Date();
            const diffTime = expiryDate.getTime() - now.getTime();
            
            if (diffTime > 0) {
              const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
              const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
              const diffMinutes = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60));
              
              if (diffDays > 0) {
                setTimeRemaining(`${diffDays} days ${diffHours} hours`);
              } else if (diffHours > 0) {
                setTimeRemaining(`${diffHours} hours ${diffMinutes} minutes`);
              } else {
                setTimeRemaining(`${diffMinutes} minutes`);
              }
            } else {
              setTimeRemaining('Expired');
            }
          }
        } else {
          // No subscription found
          setSubscriptionData({ status: 'expired' });
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching subscription:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, router]);

  // Auto-check every 5 seconds for changes
  useEffect(() => {
    const interval = setInterval(() => {
      if (subscriptionData?.status === 'active' && subscriptionData?.expiryDate) {
        const expiryDate = new Date(subscriptionData.expiryDate);
        const now = new Date();
        
        if (expiryDate > now) {
          router.push('/dashboard');
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [subscriptionData, router]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Checking subscription status...</p>
        </div>
      </div>
    );
  }

  // If subscription is actually active, show loading while redirecting
  if (subscriptionData?.status === 'active' && subscriptionData?.expiryDate) {
    const expiryDate = new Date(subscriptionData.expiryDate);
    const now = new Date();
    
    if (expiryDate > now) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
          <div className="text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">Subscription Active</h2>
            <p className="text-gray-600 mb-4">Redirecting to dashboard...</p>
            <Loader className="w-8 h-8 animate-spin text-green-600 mx-auto" />
          </div>
        </div>
      );
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 flex flex-col items-center justify-center">
      <div className="max-w-lg w-full">
        {/* Status Banner */}
        <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <div>
              <h2 className="font-bold text-gray-800">Subscription Status</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                  EXPIRED
                </span>
                {timeRemaining && timeRemaining !== 'Expired' && (
                  <span className="text-sm text-gray-600">
                    Expired {timeRemaining} ago
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Urunigi Rwanyu Rwarangiye</h1>
              <p className="text-gray-600">Urunigi rwanyu rwarangiye. Mu buryo bwihuse kwishyura, twandikire.</p>
            </div>
          </div>
          
          {/* Contact Section */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-6">
            <h2 className="font-bold text-lg mb-4 text-gray-800">Amakuru yo Kwishyura:</h2>
            
            <div className="space-y-4">
              <div className="p-3 bg-white rounded-lg border border-blue-100">
                <div className="flex items-center gap-2 mb-1">
                  <Phone className="w-4 h-4 text-blue-600" />
                  <p className="font-semibold text-gray-800">Hamagara:</p>
                </div>
                <a 
                  href="tel:+250732754111" 
                  className="text-lg text-blue-600 font-bold hover:underline block"
                >
                  +250 732 754 111
                </a>
                <p className="text-sm text-gray-600 mt-2">
                  Hamagara iyi numero kwishyura ubwirakabiri
                </p>
              </div>
              
              <div className="p-3 bg-white rounded-lg border border-blue-100">
                <div className="flex items-center gap-2 mb-1">
                  <Mail className="w-4 h-4 text-blue-600" />
                  <p className="font-semibold text-gray-800">Email:</p>
                </div>
                <a 
                  href="mailto:ngobokaben" 
                  className="text-lg text-blue-600 font-bold hover:underline block"
                >
                  ngobokaben
                </a>
                <p className="text-sm text-gray-600 mt-2">
                  Tumenyesha ubwirakabiri kuri email
                </p>
              </div>
            </div>
          </div>
          
          {/* Important Notice */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <p className="text-yellow-800 text-sm">
                <strong>Ibikenewe:</strong> Hamagara <strong>+250 732 754 111</strong> kwishyura ubwirakabiri mu buryo bwihuse.
              </p>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="space-y-3">
            <a 
              href="tel:+250732754111"
              className="flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-700 
                text-white text-center font-semibold py-3 px-4 rounded-lg transition-colors"
            >
              <Phone className="w-5 h-5" />
              Hamagara +250 732 754 111
            </a>
            <a 
              href="mailto:ngobokaben"
              className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 
                text-white text-center font-semibold py-3 px-4 rounded-lg transition-colors"
            >
              <Mail className="w-5 h-5" />
              Tumenyesha kuri email
            </a>
          </div>
        </div>
        
        {/* Auto-refresh Notice */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-center gap-2 text-gray-600 text-sm">
            <Clock className="w-4 h-4" />
            <span>Iki gipimo kizasubiramo mu minsi 5 niba mwishyuye</span>
          </div>
        </div>

        {/* Subscription Info (if available) */}
        {subscriptionData && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="font-medium text-gray-800 mb-2">Amakuru y'urunigi:</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500">Status:</span>
                <div className="font-medium text-red-600">Expired</div>
              </div>
              {subscriptionData.expiryDate && (
                <div>
                  <span className="text-gray-500">Expired on:</span>
                  <div className="font-medium">
                    {new Date(subscriptionData.expiryDate).toLocaleDateString()}
                  </div>
                </div>
              )}
              {subscriptionData.plan && (
                <div>
                  <span className="text-gray-500">Plan:</span>
                  <div className="font-medium">{subscriptionData.plan}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionExpPage;