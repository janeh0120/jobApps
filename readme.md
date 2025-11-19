# Job Application Tracker

A visual job search analytics tool that tracks and visualizes job applications using an interactive grid. Filter applications by status, year, process type, and more to discover patterns in my job search.

## Features

- **Interactive Grid Visualization**: View all job applications as a grid of layered PNG images
- **Advanced Filtering**: Filter by:
  - Job title & company (text search)
  - Application status (Accepted, Rejected, No Answer/Ongoing)
  - Year applied (1st-5th year)
  - Process types (Email Questions, Interviews, Take-home Challenges, etc.)
  - Custom attributes (Design-Related, Referred, Tailored Application, Private Posting)
- **Real-time Updates**: Add new applications via modal form with instant grid refresh

## Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Node.js + Express
- **Database**: MongoDB Atlas + Prisma ORM
- **Deployment**: Vercel

## Database Schema

The Prisma schema includes the following fields:

- **Metadata**: Job_Title, Company, Applied_On, Connection_to_Company
- **Status**: Status (Accepted/Rejected/No Answer/Ongoing)
- **Classification**: Design_Related, Referred, Tailored_App, Private_Posting
- **Process**: Email_Questions, One_Sided_Interview, Behaviourial_Interview, Portfolio_Walkthrough, Take_home_Challenge, Recruiter_Call
- **Timeline**: Year (1-5)

## File Structure

```
├── public/
│   ├── index.html           # Main frontend
│   ├── script.js            # Client-side logic
│   ├── style.css            # Styling
│   └── assets/images/       # Layered PNG images
├── routes/
│   └── api.js               # Express API endpoints
├── prisma/
│   └── schema.prisma        # Database schema
├── server.js                # Express server
├── package.json
└── README.md