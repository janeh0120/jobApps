// fetch items from API endpoint and populate the content div
const getData = async () => {
    const response = await fetch('/apps')
    if (response.ok) {
        const data = await response.json()
        document.querySelector('#content').innerHTML = `<h3>✅ MongoDB connected. </h3>`
        console.log(data)
        data.forEach(item => {
            let div = document.createElement('div')
            const title = item.Job_Title || item.JobTitle || item.name || item.Company || 'Untitled'
            div.textContent = title
            document.querySelector('#content').appendChild(div)
        })
    }
    else {
        document.querySelector('#content').innerHTML = `<div>❌ MongoDB is not connected. Please check your connection string in .env file.</div>`
    }

}

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

        // convert checkbox booleans
        out.Design_Related_ = !!document.querySelector('#isRelated')?.checked
        out.Offered = !!document.querySelector('#isOffered')?.checked
        out.Referred_ = !!document.querySelector('#isReferred')?.checked
        out.Tailored_App_ = !!document.querySelector('#isTailored')?.checked

        // send payload to server
        const resp = await fetch('/apps', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(out)
        })
        if (resp.ok) {
            // refresh list
            getData()
            form.reset()
        } else {
            console.error('Failed to save', await resp.text())
            alert('Failed to save entry')
        }
    })
}
