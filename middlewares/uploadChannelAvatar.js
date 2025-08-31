import multer from "multer";
import path from "path";
import fs from "fs";

const channelAvatarsDir = path.join(process.cwd(), "uploads", "channels");
if (!fs.existsSync(channelAvatarsDir)) {
  fs.mkdirSync(channelAvatarsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, channelAvatarsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const channelId = req.params?.channelId || 'unknown';
    const timestamp = Date.now();
    const uniqueName = `${channelId}-${timestamp}${ext}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"), false);
  }
};

const uploadChannelAvatar = multer({ storage, fileFilter });

export default uploadChannelAvatar;
