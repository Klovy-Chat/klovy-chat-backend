import { mkdirSync, renameSync } from "fs";

const uploadFile = async (request, response, next) => {
  try {
    if (request.file) {
      const allowedExt = [
        "pdf",
        "jpg",
        "jpeg",
        "png",
        "webp",
        "docx",
        "xlsx",
        "txt",
      ];
      const ext = request.file.originalname.split(".").pop().toLowerCase();

      if (!allowedExt.includes(ext)) {
        return response.status(400).send("Invalid file type.");
      }

      const userId = request.user?.id || "anon";
      const timestamp = Date.now();

      let fileDir = `uploads/files/${timestamp}`;
      let fileName = `${fileDir}/${userId}-${timestamp}.${ext}`;

      mkdirSync(fileDir, { recursive: true });
      renameSync(request.file.path, fileName);

      return response.status(200).json({ filePath: fileName });
    } else {
      return response.status(404).send("File is required.");
    }
  } catch (error) {
    console.log({ error });
    return response.status(500).send("Internal Server Error.");
  }
};

export default uploadFile;
