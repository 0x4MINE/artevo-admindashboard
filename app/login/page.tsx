"use client";

import Image from "next/image";
import { FaUser, FaLock } from "react-icons/fa";
import Btn from "@/components/Btn";
import { Button } from "@/components/ui/button";
import { useActionState } from "react";
import { login } from "@/lib/actions/authActions";
export default function Login() {
  const [state, loginAction] = useActionState(login, { errors: {} });
  return (
    <div className="flex min-h-screen bg-background justify-center items-center ">
      <form
        action={loginAction}
        className="bg-primary p-8 rounded-4xl flex flex-col gap-2 mx-4"
      >
        <div className="flex justify-center items-center">
          <Image src={"/logo.png"} alt="logo" width={390} height={180} />
        </div>

        <h2 className="text-center text-4xl text-title font-bold my-6">
          LOGIN
        </h2>

        {state?.errors?.auth && <p>{state?.errors?.auth}</p>}
        {state?.errors?.name && <p>{state?.errors?.name}</p>}
        <div className="bg-secondary flex items-center py-4 px-6 text-subtitle gap-4 rounded-2xl">
          <FaUser />
          <input
            name="name"
            type="text"
            placeholder="Username"
            className="outline-none w-full h-full "
          />
        </div>
        {state?.errors?.password && <p>{state?.errors?.password}</p>}
        <div className="bg-secondary flex items-center py-4 px-6 text-subtitle gap-4 rounded-2xl">
          <FaLock />
          <input
            name="password"
            type="password"
            placeholder="********"
            className="outline-none w-full h-full"
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-700 mb-6 ml-1">
          <input type="checkbox" className="accent-secondary" name="remember" />
          <label>Remember me</label>
        </div>
        <button
          className=" text-center p-2 bg-btn-primary text-white  hover:bg-btn-secondary transition rounded-[10px] cursor-pointer"
          type="submit"
        >
          login
        </button>
      </form>
    </div>
  );
}
