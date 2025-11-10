// Below we will use the Express Router to define a read only API endpoint
// Express will listen for API requests and respond accordingly
import express from 'express'
const router = express.Router()

// Set this to match the model name in your Prisma schema
const model = 'apps'

// Prisma lets NodeJS communicate with MongoDB
// Let's import and initialize the Prisma client
// See also: https://www.prisma.io/docs
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()


// ----- basic findMany() -------
// This endpoint uses the Prisma schema defined in /prisma/schema.prisma
// This gives us a cleaner data structure to work with. 
router.get('/apps', async (req, res) => {
    try {
        // fetch first 10 records from the database with no filter
        const result = await prisma[model].findMany({
            take: 10
        })
        res.send(result)
    } catch (err) {
        console.log(err)
        res.status(500).send(err)
    }
})


// ----- create a new app record -------
router.post('/apps', async (req, res) => {
    try {
        const body = req.body || {}

        // map incoming form keys to Prisma model fields
        const data = {
            Job_Title: body.Job_Title || body.JobTitle || body.jobTitle || '',
            Company: body.Company || '',
            Applied_On: body.Applied_On || body.AppliedOn || body.appliedOn || '',
            Connection_to_Company_: body.Connection_to_Company_ || body.Connection_To_Company || body.connectionToCompany || '',
            Design_Related_: body.Design_Related_ ?? body.isRelated ?? false,
            Offered: body.Offered ?? body.isOffered ?? false,
            Process: body.Process || body.process || [],
            Referred_: body.Referred_ ?? body.isReferred ?? false,
            Status: body.Status || body.status || '',
            Tailored_App_: body.Tailored_App_ ?? body.isTailored ?? false
        }

        // Year_ in the schema is an Int; try to parse a numeric prefix from provided year string
        let parsedYear
        if (body.Year_ !== undefined) parsedYear = Number(body.Year_)
        else if (body.year) {
            const m = String(body.year).match(/\d+/)
            parsedYear = m ? Number(m[0]) : undefined
        }
        if (parsedYear !== undefined && !Number.isNaN(parsedYear)) data.Year_ = parsedYear

        const created = await prisma[model].create({ data })
        res.status(201).send(created)
    } catch (err) {
        console.error(err)
        res.status(500).send({ error: String(err) })
    }
})


// ----- findMany() with search ------- 
// Accepts optional search parameter to filter by name field
// See also: https://www.prisma.io/docs/orm/reference/prisma-client-reference#examples-7
router.get('/search', async (req, res) => {
    try {
        // get search terms from query string, default to empty string
        const searchTerms = req.query.terms || ''
        // fetch the records from the database
        const result = await prisma[model].findMany({
            where: {
                name: {
                    contains: searchTerms,
                    mode: 'insensitive'  // case-insensitive search
                }
            },
            orderBy: { name: 'asc' },
            take: 10
        })
        res.send(result)
    } catch (err) {
        console.log(err)
        res.status(500).send(err)
    }
})


// ----- findRaw() -------
// Returning Raw records from MongoDB
// This endpoint does not use any schema. 
// This is can be useful for testing and debugging.
router.get('/raw', async (req, res) => {
    try {
        // raw queries use native MongoDB query syntax
        // e.g. "limit" instead of "take"
        const options = { limit: 10 };
        const results = await prisma[model].findRaw({ options });
        res.send(results);
    } catch (err) {
        console.log(err)
        res.status(500).send(err)
    }
})


// export the api routes for use elsewhere in our app 
// (e.g. in index.js )
export default router;

