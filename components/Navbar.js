"use client"; 
import React from "react"; 
import Image from "next/image"; 
import Link from "next/link"; 
import { usePathname } from "next/navigation"; 
import Logo from "../assets/Logo.png"; 
import { ArrowRight } from "lucide-react";  

const Navbar = () => {   
  const pathname = usePathname();    

  // Determine button text and link based on current page   
  const isLoginPage = pathname === "/login";   
  const buttonText = isLoginPage ? "Iyandikishe" : "Injira";   
  const buttonLink = isLoginPage ? "/signup" : "/login";    

  return (     
    <div className="w-full flex h-20 md:h-28 items-center justify-between px-6 md:px-12 py-2 bg-white shadow-md">       
      {/* Logo */}       
      <div className="flex items-center">         
        <Image           
          src={Logo}           
          alt="Logo"           
          width={200}           
          height={50}           
          className="object-contain"           
          style={{ width: "200px", height: "auto" }}         
        />       
      </div>        

      {/* Dynamic Button */}       
      <div className="hidden md:block"> {/* Hidden on mobile, visible on medium screens and up */}         
        <Link href={buttonLink}>           
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-green-600 text-green-600 font-medium hover:bg-green-50 transition">             
            {buttonText}             
            <ArrowRight size={18} />           
          </button>         
        </Link>       
      </div>

      {/* Mobile Button */}       
      <div className="md:hidden flex items-center"> {/* Visible only on mobile screens */}         
        <Link href={buttonLink}>           
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-green-600 text-green-600 font-medium hover:bg-green-50 transition">             
            {buttonText}             
            <ArrowRight size={18} />           
          </button>         
        </Link>       
      </div>     
    </div>   
  ); 
};

export default Navbar;
