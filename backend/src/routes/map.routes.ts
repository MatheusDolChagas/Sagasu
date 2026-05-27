import { Router } from 'express';
import {
  getMapMarkers,
  getMapHeatmap,
  geocodeAddress,
  geocodeSuggest,
} from '../controllers/map.controller';

const router = Router();

router.get('/markers', getMapMarkers);
router.get('/heatmap', getMapHeatmap);
router.get('/geocode/suggest', geocodeSuggest);
router.get('/geocode', geocodeAddress);

export default router;
