const callContractReviewService = require("../services/contractReviewService");
const { uploadToCloudinary } = require("../utils/fileUpload");

exports.reviewContract = async (req, res) => {
  try {
    const userId = req.user?.id;
    const files = req.files; // Get uploaded files,
    
    if (!files || files.length === 0) {
      return res.status(400).json({ error: "At least one file is required" });
    }

    // Upload all files concurrently to Cloudinary
    const folder = `scaleworks/${userId}/contractReview`;
    const uploadPromises = files.map((file) =>
      uploadToCloudinary(file, folder)
    );
    const documentUrls = await Promise.all(uploadPromises);

    if (!documentUrls || documentUrls.length === 0) {
      return res.status(500).json({ error: "File upload failed" });
    }


    // Set headers for streaming response
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders(); // Send headers immediately

    let streamClosed = false; // Track stream status

    await callContractReviewService(
      userId,
      documentUrls,
      (data) => {
        if (streamClosed) return; // Avoid writing after stream is closed
        if (data["out-0"]) {
            res.write(
                `data: ${JSON.stringify({
                    type: "SUCCESS",
                    message: data["out-0"],
                })}\n\n`
            );
        }
      },
      (error) => {
        console.error("Contract Review Error:", error);
        if (streamClosed) return; // Avoid duplicate writes
        res.write(
          `event: error\ndata: ${JSON.stringify({
            type: "ERROR",
            message: error,
          })}\n\n`
        );
        res.end();
        streamClosed = true;
        return; // Stop further execution
      }
    );

    if (!streamClosed) {
      res.write(
        `data: ${JSON.stringify({
          type: "END",
          message: "Streaming complete",
        })}\n\n`
      );
      setTimeout(() => {
        res.end();
      }, 500);
    }
  } catch (error) {
    console.error("Streaming Error:", error);
    res.write(
      `event: error\ndata: ${JSON.stringify({
        type: "SERVER_ERROR",
        message: error.message,
      })}\n\n`
    );
    res.end();
  }
};
