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

// helper: parse common truthy/falsy query param values
function parseBool(v) {
    if (v === undefined || v === null) return undefined
    const s = String(v).trim().toLowerCase()
    if (s === '') return undefined
    if (['1', 'true', 'yes', 'on'].includes(s)) return true
    if (['0', 'false', 'no', 'off'].includes(s)) return false
    return undefined
}


// ----- basic findMany() -------
// This endpoint uses the Prisma schema defined in /prisma/schema.prisma
// This gives us a cleaner data structure to work with. 
router.get('/apps', async (req, res) => {
    try {
        // Support basic query params for filtering and pagination
        const limit = Math.min(parseInt(req.query.limit) || 50, 1000)
        const skip = Math.max(parseInt(req.query.skip) || 0, 0)

    const { jobTitle, company, connectionToCompany, process, design, referred, tailored, status, year } = req.query

        const where = {}
        if (jobTitle) where.Job_Title = { contains: jobTitle, mode: 'insensitive' }
        if (company) where.Company = { contains: company, mode: 'insensitive' }
        if (connectionToCompany) where.Connection_to_Company = { contains: connectionToCompany, mode: 'insensitive' }
    if (status) where.Status = { equals: status, mode: 'insensitive' }
    if (year) where.Year = parseInt(year)
    const d = parseBool(design)
    if (d !== undefined) where.Design_Related = d
    const r = parseBool(referred)
    if (r !== undefined) where.Referred = r
    const t = parseBool(tailored)
    if (t !== undefined) where.Tailored_App = t
        if (process) {
            // allow comma-separated values, map to boolean process fields (AND semantics)
            const terms = String(process).split(',').map(s => s.trim()).filter(Boolean)
            const and = []
            for (const t of terms) {
                const lc = t.toLowerCase()
                if (lc === 'email' || lc.includes('email')) and.push({ Email_Questions: true })
                else if (lc.includes('one-sided') || lc.includes('one sided')) and.push({ One_Sided_Interview: true })
                else if (lc.includes('behaviour') || lc.includes('behavioural')) and.push({ Behaviourial_Interview: true })
                else if (lc.includes('portfolio')) and.push({ Portfolio_Walkthrough: true })
                else if (lc.includes('recruiter')) and.push({ Recruiter_Call: true })
                else if (lc.includes('design') || lc.includes('take-home') || lc.includes('take home')) and.push({ Take_home_Challenge: true })
                else if (lc.includes('private')) and.push({ Private_Posting: true })
            }
            if (and.length === 1) Object.assign(where, and[0])
            else if (and.length > 1) where.AND = and
        }

        const result = await prisma[model].findMany({
            where,
            take: limit,
            skip,
            orderBy: { Job_Title: 'asc' }
        })
        res.send(result)
    } catch (err) {
        console.log(err)
        res.status(500).send(err)
    }
})

// return total number of entries in the collection
router.get('/apps/count', async (req, res) => {
    try {
        // Prisma count on the model
        const total = await prisma[model].count()
        res.send({ count: total })
    } catch (err) {
        console.error(err)
        res.status(500).send({ error: String(err) })
    }
})


// ----- create a new app record -------
router.post('/apps', async (req, res) => {
    try {
        const body = req.body || {}

        // map incoming form keys to Prisma model fields
        // derive process booleans from incoming process array or individual flags
        const proc = body.Process || body.process || []
        const hasProc = (term) => {
            if (!proc) return false
            if (Array.isArray(proc)) return proc.map(p => String(p).toLowerCase()).some(p => p.includes(term))
            return String(proc).toLowerCase().includes(term)
        }

        const data = {
            Job_Title: body.Job_Title || body.JobTitle || body.jobTitle || '',
            Company: body.Company || '',
            Applied_On: body.Applied_On || body.AppliedOn || body.appliedOn || '',
            Connection_to_Company: body.Connection_to_Company || body.Connection_To_Company || body.connectionToCompany || '',
            Design_Related: body.Design_Related ?? body.isRelated ?? false,
            // map process selections to boolean fields detected by introspection
            Email_Questions: body.Email_Questions ?? hasProc('email') ?? false,
            One_Sided_Interview: body.One_Sided_Interview !== undefined ? body.One_Sided_Interview : (hasProc('one-sided') || hasProc('one sided')),
            Behaviourial_Interview: body.Behaviourial_Interview !== undefined ? body.Behaviourial_Interview : (hasProc('behaviour') || hasProc('behavioural') || hasProc('behavior')),
            Portfolio_Walkthrough: body.Portfolio_Walkthrough ?? hasProc('portfolio') ?? false,
            Recruiter_Call: body.Recruiter_Call ?? hasProc('recruiter') ?? false,
            Take_home_Challenge: body.Take_home_Challenge !== undefined ? body.Take_home_Challenge : (hasProc('design') || hasProc('take-home') || hasProc('take home')),
            Private_Posting: body.Private_Posting ?? hasProc('private') ?? false,
            Referred: body.Referred ?? body.isReferred ?? false,
            Status: body.Status || body.status || '',
            Tailored_App: body.Tailored_App ?? body.isTailored ?? false
        }

        // Year in the schema is an Int; try to parse a numeric prefix from provided year string
        let parsedYear
        if (body.Year !== undefined) parsedYear = Number(body.Year)
        else if (body.year) {
            const m = String(body.year).match(/\d+/)
            parsedYear = m ? Number(m[0]) : undefined
        }
        if (parsedYear !== undefined && !Number.isNaN(parsedYear)) data.Year = parsedYear

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

