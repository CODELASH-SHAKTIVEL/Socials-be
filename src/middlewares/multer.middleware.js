import multer from "multer";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './public/temp')
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
      cb(null, file.originalname + '-' + uniqueSuffix)
    }
  })
  export const upload = multer(
    { 
     storage,
    })

    //** Info **// 
    // by using the multer we are going to keep the file for smaller period of time in the local storage by diskstorage and then upload to cloud storage
    // cb is called callback function which returns file orignalname into localpathfile it give the path full disk/c/localpathfile