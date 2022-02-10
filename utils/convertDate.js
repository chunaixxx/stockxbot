const convertDate = ms => {
    var options = {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        timezone: 'UTC'
    };

    return new Date(+ms).toLocaleString('ru', options)
}

export default convertDate