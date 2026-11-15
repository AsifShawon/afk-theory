import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { CAMPAIGN_MODULE } from "../../modules/campaign"

export const deleteCampaignSlideStep = createStep(
  "delete-campaign-slide",
  async (id: string, { container }) => {
    const campaignService = container.resolve(CAMPAIGN_MODULE) as any
    const prev = await campaignService.retrieveCampaignSlide(id)
    await campaignService.deleteCampaignSlides(id)

    return new StepResponse({ success: true }, prev)
  },
  async (prev: any, { container }) => {
    if (prev) {
      const campaignService = container.resolve(CAMPAIGN_MODULE) as any
      await campaignService.createCampaignSlides(prev)
    }
  }
)

export const deleteCampaignSlideWorkflow = createWorkflow(
  "delete-campaign-slide",
  (id: string) => {
    const result = deleteCampaignSlideStep(id)
    return new WorkflowResponse(result)
  }
)
