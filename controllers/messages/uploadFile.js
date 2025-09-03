import { mkdirSync, renameSync } from "fs";
import path from "path";

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

      const originalName = path.basename(request.file.originalname);
      const ext = path.extname(originalName).slice(1).toLowerCase();

      if (!allowedExt.includes(ext)) {
        return response.status(400).send("Invalid file type.");
      }

      if (
        originalName.includes("..") ||
        originalName.includes("/") ||
        originalName.includes("\\")
      ) {
        return response.status(400).send("Invalid file name.");
      }

      const userId = request.user?.id || request.userId;

      if (!userId) {
        return response.status(401).send("Authentication required.");
      }

      const timestamp = Date.now();
      const sanitizedUserId = userId.toString().replace(/[^a-zA-Z0-9]/g, "");

      let fileDir = `uploads/files/${timestamp}`;
      let fileName = `${fileDir}/${sanitizedUserId}-${timestamp}.${ext}`;

      const resolvedPath = path.resolve(fileName);
      const expectedPath = path.resolve(
        `uploads/files/${timestamp}/${sanitizedUserId}-${timestamp}.${ext}`,
      );

      if (resolvedPath !== expectedPath) {
        return response.status(400).send("Invalid file path.");
      }

      mkdirSync(fileDir, { recursive: true });
      renameSync(request.file.path, fileName);

      return response.status(200).json({ filePath: fileName });
    } else {
      return response.status(400).send("File is required.");
    }
  } catch (error) {
    console.error("File upload error");
    return response.status(500).send("Internal Server Error.");
  }
};

export default uploadFile;
