const convertURL = url => {
    switch (true) {
        case url.startsWith('https://'):
            return url.replace('https://', '').toLowerCase()
        case url.startsWith('http://'):
            return url.replace('http://', '').toLowerCase()
        default:
            return url.toLowerCase()
    }
}

export default convertURL