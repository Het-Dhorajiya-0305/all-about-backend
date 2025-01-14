const asyncnhandler=(resulthandler)=>{
    return (res,req,next)=>{
        Promise
        .resolve(resulthandler(res,req,next))
        .catch((err)=>next(err))
    }
}

export {aysnhandler}