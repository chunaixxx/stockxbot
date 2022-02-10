export default res => {
    if (res.statusCode !== 200 && res.statusCode !== 204){
        // writeBody(res.body);
        throw new Error("Status code: " + res.statusCode);
    }
}