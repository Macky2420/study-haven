import React from "react";
import { createBrowserRouter } from "react-router-dom";
import Hero from "../pages/Hero";
import Layout from "../layout/Layout";
import Forum from "../pages/Forum";
import StudyTools from "../pages/StudyTools";
import Profile from "../pages/Profile";

export const router = createBrowserRouter([
    {
        path: "/",
        element: <Hero/>
    },
    {
        path: "/forum/:userId",
        element: <Layout/>,
        children: [{
            index: true,
            element: <Forum/>
        }]
    },
    {
        path: "/study-tools/:userId",
        element: <Layout/>,
        children: [{
            index: true,
            element: <StudyTools/>
        }]
    },
    {
        path: "/profile/:userId",
        element: <Layout/>,
        children: [{
            index: true,
            element: <Profile/>
        }]
    }
])