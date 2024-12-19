import multer from "multer";



export const getFile = (fieldName:string) => {
  return multer().single(fieldName)
};