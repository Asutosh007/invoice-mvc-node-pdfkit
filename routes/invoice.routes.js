const express = require("express");
const controller = require("../controllers/invoice.controller");

const router = express.Router();

router.post("/", controller.create);
router.get("/", controller.list);
router.get("/:id", controller.get);
router.put("/:id", controller.update);
router.delete("/:id", controller.remove);

router.get("/:id/pdf", controller.pdf);
router.get("/:id/pdf/preview", controller.previewPdf);

module.exports = router;