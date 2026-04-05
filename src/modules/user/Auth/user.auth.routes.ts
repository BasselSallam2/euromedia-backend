import { Router } from "express";
import AuthController from "./user.auth.controller";
import { protect } from "@/middlewares/protect";
import { UserModel } from "../user.schema";


const router = Router();

router.post("/signin", AuthController.signin);
router.get("/me", protect, AuthController.getMe);





export default router;