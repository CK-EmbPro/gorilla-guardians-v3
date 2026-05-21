import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import productsRouter from "./products";
import artisansRouter from "./artisans";
import experiencesRouter from "./experiences";
import ordersRouter from "./orders";
import bookingsRouter from "./bookings";
import reviewsRouter from "./reviews";
import notificationsRouter from "./notifications";
import messagesRouter from "./messages";
import miscRouter from "./misc";
import uploadRouter from "./upload";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(uploadRouter);
router.use(productsRouter);
router.use(artisansRouter);
router.use(experiencesRouter);
router.use(ordersRouter);
router.use(bookingsRouter);
router.use(reviewsRouter);
router.use(notificationsRouter);
router.use(messagesRouter);
router.use(miscRouter);

export default router;
