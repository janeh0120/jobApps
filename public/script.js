// Helper to format application details
function formatApplicationDetails(item) {
    const title = item.Job_Title || item.JobTitle || item.Company || 'Untitled'
    const company = item.Company || '—'
    const applied = item.Applied_On || item.AppliedOn || '—'
    const connection = item.Connection_to_Company || item.Connection_To_Company || '—'
    const design = item.Design_Related ? 'Yes' : 'No'
    const referred = item.Referred ? 'Yes' : 'No'
    const tailored = item.Tailored_App ? 'Yes' : 'No'
    const status = item.Status || item.status || '—'
    
    const processFlags = [
        ['Email Questions', item.Email_Questions],
        ['One-sided', item.One_Sided_Interview],
        ['Behavioural', item.Behaviourial_Interview],
        ['Portfolio', item.Portfolio_Walkthrough],
        ['Take-home Challenge', item.Take_home_Challenge],
        ['Recruiter', item.Recruiter_Call],
        ['Private', item.Private_Posting]
    ]
    const process = processFlags.filter(([label, flag]) => !!flag).map(([label]) => label)
    
    let year = '—'
    if (item.Year !== undefined && item.Year !== null) {
        if (typeof item.Year === 'object') year = JSON.stringify(item.Year)
        else year = String(item.Year)
    }
    
    return {
        title, company, applied, connection, design, referred, tailored, status, process, year
    }
}

// fetch items from API endpoint (no longer rendered as list)
const getData = async (params = {}) => {
    const qs = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => {
        if (v === undefined || v === null || v === '') return
        qs.append(k, v)
    })
    const url = '/apps' + (qs.toString() ? ('?' + qs.toString()) : '')
    const response = await fetch(url)
    if (response.ok) {
        getCount()
    }
}

// Render applications as grid squares with layered images
const renderGrid = async (params = {}) => {
    // Always fetch ALL records, then filter on client-side
    const qs = new URLSearchParams()
    qs.append('limit', '10000')
    const url = '/apps?' + qs.toString()
    const response = await fetch(url)
    if (response.ok) {
        let allData = await response.json()
        
        // Sort by Year Applied (ascending), then by date added (oldest first, newest last)
        allData = allData.sort((a, b) => {
            const yearA = a.Year !== undefined && a.Year !== null ? parseInt(a.Year) : Infinity
            const yearB = b.Year !== undefined && b.Year !== null ? parseInt(b.Year) : Infinity
            
            // First sort by year
            if (yearA !== yearB) return yearA - yearB
            
            // Then sort by creation date (id or createdAt) - oldest first, newest last
            const idA = a.id || a._id || 0
            const idB = b.id || b._id || 0
            return String(idA).localeCompare(String(idB))
        })
        
        const gridContainer = document.querySelector('#gridContainer')
        gridContainer.innerHTML = ''
        
        // Check if any filters are actually active
        const hasActiveFilters = Object.keys(params).length > 0
        
        // Helper function to check if an entry matches the filters
        const matchesFilters = (item, filters) => {
            if (Object.keys(filters).length === 0) return true // No filters applied
            
            if (filters.jobTitle && !item.Job_Title?.toLowerCase().includes(filters.jobTitle.toLowerCase())) return false
            if (filters.company && !item.Company?.toLowerCase().includes(filters.company.toLowerCase())) return false
            if (filters.connectionToCompany && !item.Connection_to_Company?.toLowerCase().includes(filters.connectionToCompany.toLowerCase())) return false
            if (filters.status && item.Status?.toLowerCase() !== filters.status.toLowerCase()) return false
            if (filters.year && item.Year !== parseInt(filters.year)) return false
            if (filters.design && !item.Design_Related) return false
            if (filters.referred && !item.Referred) return false
            if (filters.tailored && !item.Tailored_App) return false
            
            // Check process filters (AND logic)
            if (filters.process) {
                const processTags = filters.process.split(',').map(t => t.trim().toLowerCase())
                for (const tag of processTags) {
                    if (tag === 'email' && !item.Email_Questions) return false
                    if (tag === 'one-sided' && !item.One_Sided_Interview) return false
                    if (tag === 'behavioural' && !item.Behaviourial_Interview) return false
                    if (tag === 'portfolio' && !item.Portfolio_Walkthrough) return false
                    if (tag === 'recruiter' && !item.Recruiter_Call) return false
                    if (tag === 'design' && !item.Take_home_Challenge) return false
                    if (tag === 'private' && !item.Private_Posting) return false
                }
            }
            
            return true
        }
        
        allData.forEach(item => {
            const isMatch = matchesFilters(item, params)
            const shouldFade = hasActiveFilters && !isMatch
            const square = document.createElement('div')
            square.className = 'grid-square'
            if (shouldFade) square.classList.add('grid-square--faded')
            
            // Build list of image layers with metadata about what they represent
            const layers = []
            
            // Layer 1 (BACK): Offered status image - foundation
            if (item.Status) {
                const status = String(item.Status).toLowerCase()
                if (status.includes('offered')) layers.push({ name: 'offered.png', relatedFilters: ['status'] })
            }
            
            // Layer 2: Process type images (multiple possible)
            if (item.Email_Questions) layers.push({ name: 'email_questions.png', relatedFilters: ['process'] })
            if (item.One_Sided_Interview) layers.push({ name: 'one-sided_interview.png', relatedFilters: ['process'] })
            if (item.Behaviourial_Interview) layers.push({ name: 'behavioural_interview.png', relatedFilters: ['process'] })
            if (item.Portfolio_Walkthrough) layers.push({ name: 'portfolio_walkthrough.png', relatedFilters: ['process'] })
            if (item.Take_home_Challenge) layers.push({ name: 'take-home_challenge.png', relatedFilters: ['process'] })
            if (item.Recruiter_Call) layers.push({ name: 'recruiter_call.png', relatedFilters: ['process'] })
            
            // Layer 3: Private Posting
            if (item.Private_Posting) layers.push({ name: 'private_posting.png', relatedFilters: ['process'] })
            
            // Layer 4: Other status images (no answer, ongoing)
            if (item.Status) {
                const status = String(item.Status).toLowerCase()
                if (status.includes('no answer') || status.includes('ongoing')) layers.push({ name: 'no_answer_ongoing.png', relatedFilters: ['status'] })
            }
            
            // Layer 5: Design-related
            if (item.Design_Related) layers.push({ name: 'design-related.png', relatedFilters: ['design'] })
            
            // Layer 6: Referred
            if (item.Referred) layers.push({ name: 'referred.png', relatedFilters: ['referred'] })
            
            // Layer 7: Tailored App
            if (item.Tailored_App) layers.push({ name: 'tailored_app.png', relatedFilters: ['tailored'] })
            
            // Layer 8 (NEAR TOP): Year images - on top of most things
            if (item.Year !== undefined && item.Year !== null) {
                const year = parseInt(item.Year)
                if (year >= 1 && year <= 5) {
                    layers.push({ name: `Year${year}.png`, relatedFilters: ['year'] })
                }
            }
            
            // Layer 9 (VERY TOP/FRONT): Accepted and Rejected status images - on top of everything
            if (item.Status) {
                const status = String(item.Status).toLowerCase()
                if (status.includes('accepted')) layers.push({ name: 'accepted.png', relatedFilters: ['status'] })
                else if (status.includes('rejected')) layers.push({ name: 'rejected.png', relatedFilters: ['status'] })
            }
            
            // Helper: check if an image is related to any active filters
            const imageIsRelevant = (layer) => {
                if (!hasActiveFilters) return true // No filters = all relevant
                
                // Check if this layer's related filters match any active filter
                if (params.design && layer.relatedFilters.includes('design')) return true
                if (params.referred && layer.relatedFilters.includes('referred')) return true
                if (params.tailored && layer.relatedFilters.includes('tailored')) return true
                if (params.status && layer.relatedFilters.includes('status')) return true
                if (params.year && layer.relatedFilters.includes('year')) return true
                if (params.process && layer.relatedFilters.includes('process')) return true
                if (params.jobTitle && layer.relatedFilters.includes('jobTitle')) return true
                if (params.company && layer.relatedFilters.includes('company')) return true
                if (params.connectionToCompany && layer.relatedFilters.includes('connectionToCompany')) return true
                
                return false
            }
            
            // Add layered images
            layers.forEach(layer => {
                const img = document.createElement('img')
                img.src = `/assets/images/${layer.name}`
                img.alt = layer.name.replace('.png', '').replace(/_/g, ' ')
                img.onerror = () => {
                    console.warn(`Failed to load image: ${layer.name}`)
                }
                
                // Apply opacity to images that don't match active filters
                if (isMatch && hasActiveFilters && !imageIsRelevant(layer)) {
                    img.style.opacity = '0.5'
                }
                
                square.appendChild(img)
            })
            
            // Add hover handlers to show detail card
            square.addEventListener('mouseenter', (e) => {
                const details = formatApplicationDetails(item)
                const tooltip = document.querySelector('#detailTooltip')
                const detailTitle = document.querySelector('#detailTitle')
                const detailContent = document.querySelector('#detailContent')
                
                detailTitle.textContent = details.title
                detailContent.innerHTML = `
                    <p><strong>Company:</strong> ${escapeHtml(details.company)}</p>
                    <p><strong>Applied:</strong> ${escapeHtml(details.applied)}</p>
                    <p><strong>Connection:</strong> ${escapeHtml(details.connection)}</p>
                    <p><strong>Design Related:</strong> ${escapeHtml(details.design)}</p>
                    <p><strong>Referred:</strong> ${escapeHtml(details.referred)}</p>
                    <p><strong>Tailored App:</strong> ${escapeHtml(details.tailored)}</p>
                    <p><strong>Status:</strong> ${escapeHtml(details.status)}</p>
                    <p><strong>Process:</strong> ${details.process.length ? details.process.map(escapeHtml).map(s => `<span class="badge">${s}</span>`).join(' ') : '—'}</p>
                    <p><strong>Year:</strong> ${escapeHtml(details.year)}</p>
                `
                
                // Position tooltip near the square with boundary checks
                const rect = square.getBoundingClientRect()
                tooltip.style.display = 'block' // Display first to get dimensions
                
                const tooltipRect = tooltip.getBoundingClientRect()
                const tooltipWidth = tooltipRect.width
                const tooltipHeight = tooltipRect.height
                const viewportWidth = window.innerWidth
                const viewportHeight = window.innerHeight
                const padding = 10
                
                // Calculate horizontal position (right of square by default)
                let left = rect.right + padding
                // If tooltip would overflow right edge, position it to the left of square instead
                if (left + tooltipWidth > viewportWidth) {
                    left = rect.left - tooltipWidth - padding
                }
                
                // Calculate vertical position (align with top by default)
                let top = rect.top
                // If tooltip would overflow bottom edge, position it above the square instead
                if (top + tooltipHeight > viewportHeight) {
                    top = Math.max(0, viewportHeight - tooltipHeight - padding)
                }
                
                tooltip.style.left = left + 'px'
                tooltip.style.top = top + 'px'
            })
            
            square.addEventListener('mouseleave', (e) => {
                const tooltip = document.querySelector('#detailTooltip')
                tooltip.style.display = 'none'
            })
            
            gridContainer.appendChild(square)
        })
        
        getCount()
    } else {
        const gridContainer = document.querySelector('#gridContainer')
        gridContainer.innerHTML = '<div>❌ Failed to load applications</div>'
    }
}

// Initial render grid on page load
renderGrid()

getData()

// handle form submission
const form = document.querySelector('#myForm')
if (form) {
    form.addEventListener('submit', async (evt) => {
        evt.preventDefault()

        // build payload from form elements
        const fd = new FormData(form)
        const out = {}
        for (const [k, v] of fd.entries()) {
            // handle multiple checkboxes with same name (process)
            if (out[k]) {
                if (Array.isArray(out[k])) out[k].push(v)
                else out[k] = [out[k], v]
            } else {
                out[k] = v
            }
        }

    // convert checkbox booleans for schema-aligned fields
    out.Design_Related = !!document.querySelector('#Design_Related')?.checked
    out.Referred = !!document.querySelector('#Referred')?.checked
    out.Tailored_App = !!document.querySelector('#Tailored_App')?.checked
    out.Private_Posting = !!document.querySelector('#Private_Posting')?.checked

    // process boolean fields
    out.Email_Questions = !!document.querySelector('#Email_Questions')?.checked
    out.One_Sided_Interview = !!document.querySelector('#One_Sided_Interview')?.checked
    out.Behaviourial_Interview = !!document.querySelector('#Behaviourial_Interview')?.checked
    out.Portfolio_Walkthrough = !!document.querySelector('#Portfolio_Walkthrough')?.checked
    out.Take_home_Challenge = !!document.querySelector('#Take_home_Challenge')?.checked
    out.Recruiter_Call = !!document.querySelector('#Recruiter_Call')?.checked

        // send payload to server
        const resp = await fetch('/apps', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(out)
        })
        if (resp.ok) {
            // refresh grid with all entries
            renderGrid()
            form.reset()
            // refresh count after successful submit
            getCount()
            // close modal after successful submit
            closeModal()
        } else {
            console.error('Failed to save', await resp.text())
            alert('Failed to save entry')
        }
    })
}

// fetch and display total count
async function getCount() {
    try {
        const r = await fetch('/apps/count')
        if (!r.ok) return
        const j = await r.json()
        const el = document.querySelector('#countBadge')
        if (el && typeof j.count === 'number') el.textContent = j.count
    } catch (err) {
        console.error('Failed to fetch count', err)
    }
}

// initial count load
getCount()

// Auto-refresh system: track count and refresh grid if data changes
let lastKnownCount = null
async function autoRefreshCheck() {
    try {
        const r = await fetch('/apps/count')
        if (!r.ok) return
        const j = await r.json()
        const currentCount = j.count
        
        // If count changed (data added or deleted), refresh grid
        if (lastKnownCount !== null && lastKnownCount !== currentCount) {
            console.log(`Data changed: ${lastKnownCount} → ${currentCount}. Refreshing grid...`)
            const f = readFilters()
            await renderGrid(f)
            await getCount()
        }
        
        lastKnownCount = currentCount
    } catch (err) {
        console.error('Auto-refresh check failed', err)
    }
}

// Start auto-refresh polling every 2 seconds
setInterval(autoRefreshCheck, 2000)

// Filter form wiring
const filterForm = document.querySelector('#filterForm')
const clearFiltersBtn = document.querySelector('#clearFilters')

function readFilters() {
    const form = new FormData(filterForm)
    const out = {}
    for (const [k, v] of form.entries()) {
        if (v === '') continue
        if (k === 'design') out.design = true
        else if (k === 'referred') out.referred = true
        else if (k === 'tailored') out.tailored = true
        else out[k] = v
    }
    // unchecked checkboxes -> undefined (no filter)
    if (!document.querySelector('#filterDesign').checked) delete out.design
    if (!document.querySelector('#filterReferred').checked) delete out.referred
    if (!document.querySelector('#filterTailored').checked) delete out.tailored
    // gather all process checkboxes selected in the filter bar (including private posting)
    const procBoxes = document.querySelectorAll('.filter-process:checked')
    if (procBoxes.length > 0) {
        const vals = Array.from(procBoxes).map(b => b.value)
        out.process = vals.join(',')
    }
    return out
}

if (filterForm) {
    filterForm.addEventListener('submit', (e) => {
        e.preventDefault()
        const f = readFilters()
        renderGrid(f)
    })
}

if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener('click', () => {
        filterForm.reset()
        renderGrid({})
    })
}

// Modal behavior: open/close
const modal = document.querySelector('#modal')
const openBtn = document.querySelector('#openFormBtn')
const closeTriggers = modal ? modal.querySelectorAll('[data-close]') : []

function openModal() {
    if (!modal) return
    modal.classList.add('open')
    modal.setAttribute('aria-hidden', 'false')
}

function closeModal() {
    if (!modal) return
    modal.classList.remove('open')
    modal.setAttribute('aria-hidden', 'true')
}

if (openBtn) openBtn.addEventListener('click', () => openModal())
closeTriggers.forEach(btn => btn.addEventListener('click', () => closeModal()))

// close on Esc
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal()
})

// simple HTML escape helper
function escapeHtml(str) {
    if (str === undefined || str === null) return ''
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
}

// Custom dropdown functionality
function initCustomDropdown(buttonId, menuId, hiddenInputId) {
    const button = document.querySelector(`#${buttonId}`)
    const menu = document.querySelector(`#${menuId}`)
    const hiddenInput = document.querySelector(`#${hiddenInputId}`)
    const options = menu.querySelectorAll('.custom-option')
    
    if (!button || !menu || !hiddenInput) return
    
    // Toggle menu on button click
    button.addEventListener('click', (e) => {
        e.stopPropagation()
        menu.classList.toggle('open')
    })
    
    // Handle option selection
    options.forEach(option => {
        option.addEventListener('click', (e) => {
            e.stopPropagation()
            const value = option.getAttribute('data-value')
            const text = option.textContent.trim()
            
            // Update hidden input value
            hiddenInput.value = value
            
            // Update button text
            button.querySelector('span').textContent = text
            
            // Update selected state
            options.forEach(opt => opt.classList.remove('selected'))
            option.classList.add('selected')
            
            // Close menu
            menu.classList.remove('open')
            
            // Trigger form change for validation
            const filterForm = document.querySelector('#filterForm')
            if (filterForm) {
                filterForm.dispatchEvent(new Event('change'))
            }
        })
    })
    
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!button.contains(e.target) && !menu.contains(e.target)) {
            menu.classList.remove('open')
        }
    })
}

// Initialize custom dropdowns
initCustomDropdown('statusButton', 'statusMenu', 'filterStatus')
initCustomDropdown('yearButton', 'yearMenu', 'filterYear')

