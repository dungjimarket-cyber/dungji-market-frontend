'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { getGroupBuyConsentStatus } from '@/lib/api/consent'
import { ConsentStatus } from '@/types/groupbuy'
import { CheckCircle2, XCircle, Clock, Users } from 'lucide-react'

interface ConsentStatusCardProps {
  groupBuyId: number
  accessToken: string
}

export function ConsentStatusCard({ groupBuyId, accessToken }: ConsentStatusCardProps) {
  const [consentStatus, setConsentStatus] = useState<ConsentStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchConsentStatus()
  }, [groupBuyId, accessToken])

  const fetchConsentStatus = async () => {
    try {
      setLoading(true)
      const status = await getGroupBuyConsentStatus(accessToken, groupBuyId)
      setConsentStatus(status)
    } catch (error) {
      console.error('Failed to fetch consent status:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !consentStatus) {
    return null
  }

  const { summary, details } = consentStatus
  const progressPercentage = (summary.agreed / summary.total) * 100

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          참여자 동의 현황
        </CardTitle>
        <CardDescription>
          선택된 입찰에 대한 참여자들의 동의 상태입니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>전체 진행률</span>
            <span className="font-semibold">
              {summary.agreed}/{summary.total}명 ({progressPercentage.toFixed(0)}%)
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>동의: {summary.agreed}명</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600" />
              <span>거부: {summary.disagreed}명</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              <span>대기중: {summary.pending}명</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-600" />
              <span>만료: {summary.expired}명</span>
            </div>
          </div>
        </div>

        {summary.all_agreed && (
          <Badge className="w-full justify-center py-2" variant="default">
            모든 참여자가 동의했습니다
          </Badge>
        )}

        {summary.can_proceed && !summary.all_agreed && (
          <Badge className="w-full justify-center py-2" variant="secondary">
            진행 가능 (거부/만료 참여자 제외)
          </Badge>
        )}

        {!summary.can_proceed && (
          <Badge className="w-full justify-center py-2" variant="destructive">
            진행 불가 (동의 대기중)
          </Badge>
        )}

        <div className="border-t pt-4">
          <h4 className="font-medium mb-2 text-sm">참여자별 상태</h4>
          <div className="space-y-2">
            {details.map((detail, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{detail.user}</span>
                <Badge 
                  variant={
                    detail.status === '동의' ? 'default' : 
                    detail.status === '거부' ? 'destructive' :
                    detail.status === '만료' ? 'secondary' : 'outline'
                  }
                  className="text-xs"
                >
                  {detail.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}