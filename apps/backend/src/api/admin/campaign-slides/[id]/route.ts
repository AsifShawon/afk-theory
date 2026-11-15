import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { CAMPAIGN_MODULE } from "../../../../modules/campaign"
import { updateCampaignSlideWorkflow } from "../../../../workflows/campaign/update-campaign-slide"
import { deleteCampaignSlideWorkflow } from "../../../../workflows/campaign/delete-campaign-slide"
import { CampaignSlideSchema } from "../validators"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  const campaignService = req.scope.resolve(CAMPAIGN_MODULE) as any

  try {
    const slide = await campaignService.retrieveCampaignSlide(id)
    res.json({ campaign_slide: slide })
  } catch {
    res.status(404).json({ message: `Campaign slide with id ${id} not found` })
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  const parsed = CampaignSlideSchema.partial().safeParse(req.body)

  if (!parsed.success) {
    res.status(400).json({
      message: "Invalid campaign slide update data",
      errors: parsed.error.format(),
    })
    return
  }

  const { result } = await updateCampaignSlideWorkflow(req.scope).run({
    input: {
      id,
      data: parsed.data as any,
    },
  })

  res.json({ campaign_slide: result })
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params

  await deleteCampaignSlideWorkflow(req.scope).run({
    input: id,
  })

  res.json({
    id,
    object: "campaign_slide",
    deleted: true,
  })
}
