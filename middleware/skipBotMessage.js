export default (ctx, next) => {
    if (ctx.senderId <= 0) return
    else next()
}