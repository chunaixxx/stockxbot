export default (ctx, next) => {
    if (ctx.isChat) return
    else next()
}