import { Router } from "express";
import generate from "./review.controller.js";
const router=Router();
router.route('/').post(generate);
export default router;