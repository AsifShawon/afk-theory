import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { CAMPAIGN_MODULE } from "../../../modules/campaign"
import { createCampaignSlideWorkflow } from "../../../workflows/campaign/create-campaign-slide"
import { CampaignSlideSchema } from "./validators"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const campaignService = req.scope.resolve(CAMPAIGN_MODULE) as any
  const slides = await campaignService.listCampaignSlides(
    {},
    {
      order: { display_order: "ASC" },
    }
  )

  res.json({ campaign_slides: slides })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const parsed = CampaignSlideSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({
      message: "Invalid campaign slide data",
      errors: parsed.error.format(),
    })
    return
  }

  const { result } = await createCampaignSlideWorkflow(req.scope).run({
    input: parsed.data as any,
  })

  res.status(201).json({ campaign_slide: result })
}
