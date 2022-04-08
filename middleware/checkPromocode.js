import { activatePromocode  } from "../controllers/promocode"

export default async (ctx, next) => {
    try {
        if (!ctx.text) next()

        const result = await activatePromocode(ctx.text, ctx.state.user)

        if (result)
            ctx.send(result.message)
    } catch (e) {
        console.log(e)
    }

    next()
}