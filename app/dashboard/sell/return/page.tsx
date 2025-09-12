"use client";
import ContentNavbar from "@/components/layout/ContentNavbar";
import React, { useState } from "react";

function Return() {
  const [popUp, setPopUp] = useState();
  const [search, setSearch] = useState();
  return (
    <div>
      <ContentNavbar setPopUp={setPopUp} setSearch={setSearch} />
    </div>
  );
}

export default Return;
