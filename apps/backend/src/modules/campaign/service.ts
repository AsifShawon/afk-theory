import { MedusaService } from "@medusajs/framework/utils"
import { CampaignSlide } from "./models/campaign-slide"
import { AnnouncementBar } from "./models/announcement-bar"

export default class CampaignModuleService extends MedusaService({
  CampaignSlide,
  AnnouncementBar,
}) {}
