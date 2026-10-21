import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { CAMPAIGN_MODULE } from "../../modules/campaign"
import { CreateCampaignSlideInput } from "./create-campaign-slide"

export type UpdateCampaignSlideInput = {
  id: string
  data: Partial<CreateCampaignSlideInput>
}

export const updateCampaignSlideStep = createStep(
  "update-campaign-slide",
  async (input: UpdateCampaignSlideInput, { container }) => {
    const campaignService = container.resolve(CAMPAIGN_MODULE) as any
    const prev = await campaignService.retrieveCampaignSlide(input.id)

    const updated = await campaignService.updateCampaignSlides({
      id: input.id,
      ...input.data,
    })

    return new StepResponse(updated, { id: input.id, prev })
  },
  async (revertData: { id: string; prev: any }, { container }) => {
    const campaignService = container.resolve(CAMPAIGN_MODULE) as any
    await campaignService.updateCampaignSlides({
      id: revertData.id,
      ...revertData.prev,
    })
  }
)

export const updateCampaignSlideWorkflow = createWorkflow(
  "update-campaign-slide",
  (input: UpdateCampaignSlideInput) => {
    const slide = updateCampaignSlideStep(input)
    return new WorkflowResponse(slide)
  }
)
