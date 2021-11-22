const sortGoodsByPrice = () => {
    return (a, b) => a['price'] > b['price'] ? 1 : -1
}

export default sortGoodsByPrice