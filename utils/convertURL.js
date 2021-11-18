const convertURL = url => {
    switch (true) {
        case url.startsWith('https://'):
            return url.replace('https://', '')
        case url.startsWith('http://'):
            return url.replace('http://', '')
        default:
            return url
    }
}

export default convertURL