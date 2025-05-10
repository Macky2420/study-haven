import React from "react";
import { createBrowserRouter } from "react-router-dom";
import Hero from "../pages/Hero";
import Layout from "../layout/Layout";
import Forum from "../pages/Forum";

export const router = createBrowserRouter([
    {
        path: "/",
        element: <Hero/>
    },
    {
        path: "/home",
        element: <Layout/>,
        children: [{
            index: true,
            element: <Forum/>
        }]
    }
])