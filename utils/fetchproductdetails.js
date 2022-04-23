import util from 'util'
import postmanRequest from 'postman-request'

const request = util.promisify(postmanRequest);

import checkRes from './checkres.js'
import parseJSON from './parseJSON.js'

export default async (product, options) => {
    const proxy = options?.proxy;
    const variantArray = [];
    let webURL;
    
    if (typeof product == 'string'){
        if (product.includes('stockx.com/')) webURL = product.split('stockx.com/')[1].split('/')[0];
        else webURL = product;
    }
    else webURL = product.objectID;

    const reqOptions = {
        url: `https://stockx.com/api/products/${webURL}?includes=market&currency=USD&country=US`,
        headers: {
            'user-agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36",
            "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
            "accept-language": "en-US,en;q=0.9",
            "sec-ch-ua": " Not A;Brand\";v=\"99\", \"Chromium\";v=\"100\", \"Google Chrome\";v=\"100",
            "sec-ch-ua-mobile": "?0",
            "sec-fetch-dest": "document",
            "sec-fetch-mode": "navigate",
            "sec-fetch-site": "none",
            "sec-fetch-user": "?1",
            "upgrade-insecure-requests": "1",
            "cache-control": "max-age=0",
        },
        followAllRedirects: true,
        followRedirect: true,
        strictSSL: false,
        proxy: proxy ? 'http://' + proxy : null,
        //jar: cookieJar
    };

    const res = await request(reqOptions);

    console.log(res)

    checkRes(res);

    const { body } = res;
    const shoeObj = parseJSON(body);

    const variants = shoeObj.Product?.children;

    for (let key in variants){
        variantArray.push({
            size: variants[key].shoeSize,
            uuid: key,
            market: variants[key].market
        });
    };

    return {
        name: shoeObj.Product.shoe,
        image: shoeObj.Product.media.imageUrl,
        urlKey: shoeObj.Product.urlKey,
        pid: shoeObj.Product.styleId,
        uuid: shoeObj.Product.uuid,
        variants: variantArray
    };
};