import { onBoardingSteps } from '@/lib/data'
import Link from 'next/link'
import { getOnboardingStatus } from '@/action/onboarding'
import { ArrowRight, Check } from 'lucide-react'

const OnBoarding = async () => {
  const response = await getOnboardingStatus()

  if (response.status !== 200 || !response.steps) {
    return null
  }

  const status = response.steps

  const getStepStatus = (index: number) => {
    const isCompleted =
      index === 0
        ? status.connectStripe
        : index === 1
          ? status.createAiAgent
          : status.createWebinar

    if (isCompleted) return 'completed'

    // Find the first incomplete step
    const firstIncomplete = !status.connectStripe
      ? 0
      : !status.createAiAgent
        ? 1
        : !status.createWebinar
          ? 2
          : -1

    return index === firstIncomplete ? 'current' : 'pending'
  }

  // Check if all steps are completed
  const allCompleted = status.connectStripe && status.createAiAgent && status.createWebinar

  // If all steps are completed, don't show onboarding
  if (allCompleted) {
    return null
  }

  return (
    <div className="flex flex-col gap-4 w-full max-w-2xl">
      {onBoardingSteps.map((step, index) => {
        const stepStatus = getStepStatus(index)
        const isCompleted = stepStatus === 'completed'
        const isCurrent = stepStatus === 'current'

        return (
          <Link
            key={step.id}
            href={step.link}
            className={`
              group flex items-center justify-between gap-4 p-4 rounded-lg border transition-all
              ${
                isCompleted
                  ? 'bg-muted/20 border-primary/20 hover:bg-muted/30 hover:border-primary/30'
                  : isCurrent
                    ? 'bg-primary/10 border-primary/40 hover:bg-primary/15 hover:border-primary/50 shadow-lg shadow-primary/10'
                    : 'bg-background border-border hover:bg-muted/10 hover:border-muted-foreground/20'
              }
            `}
          >
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {/* Status Indicator */}
              <div
                className={`
                w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all
                ${
                  isCompleted
                    ? 'bg-primary text-primary-foreground'
                    : isCurrent
                      ? 'bg-primary text-primary-foreground ring-2 ring-primary/50'
                      : 'bg-muted text-muted-foreground'
                }
              `}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <span className="text-sm font-semibold">{step.id}</span>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p
                  className={`
                  text-base font-semibold mb-1
                  ${
                    isCompleted
                      ? 'text-primary'
                      : isCurrent
                        ? 'text-primary'
                        : 'text-foreground'
                  }
                `}
                >
                  {step.title}
                </p>
                <p className="text-sm text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </div>

            {/* Arrow */}
            <ArrowRight
              className={`
              w-5 h-5 flex-shrink-0 transition-transform group-hover:translate-x-1
              ${
                isCompleted
                  ? 'text-primary'
                  : isCurrent
                    ? 'text-primary'
                    : 'text-muted-foreground'
              }
            `}
            />
          </Link>
        )
      })}
    </div>
  )
}

export default OnBoarding
