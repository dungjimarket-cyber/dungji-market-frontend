'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { useToast } from '@/components/ui/use-toast'
import { getPendingConsents, updateConsentStatus } from '@/lib/api/consent'
import { ParticipantConsent } from '@/types/groupbuy'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react'

export function ConsentNotification() {
  const { accessToken } = useAuth()
  const { toast } = useToast()
  const [pendingConsents, setPendingConsents] = useState<ParticipantConsent[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedConsent, setSelectedConsent] = useState<ParticipantConsent | null>(null)
  const [actionType, setActionType] = useState<'agree' | 'disagree' | null>(null)

  useEffect(() => {
    if (accessToken) {
      fetchPendingConsents()
    }
  }, [accessToken])

  const fetchPendingConsents = async () => {
    if (!accessToken) return

    try {
      setLoading(true)
      const consents = await getPendingConsents(accessToken)
      setPendingConsents(consents)
    } catch (error) {
      console.error('Failed to fetch pending consents:', error)
      toast({
        title: '오류',
        description: '동의 요청을 불러오는데 실패했습니다.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleConsentAction = async (consent: ParticipantConsent, action: 'agree' | 'disagree') => {
    setSelectedConsent(consent)
    setActionType(action)
  }

  const confirmAction = async () => {
    if (!selectedConsent || !actionType || !accessToken) return

    try {
      await updateConsentStatus(accessToken, selectedConsent.id, actionType)
      
      toast({
        title: '성공',
        description: actionType === 'agree' 
          ? '입찰에 동의하셨습니다.' 
          : '입찰을 거부하셨습니다.',
      })

      // 목록 새로고침
      fetchPendingConsents()
    } catch (error) {
      console.error('Failed to update consent status:', error)
      toast({
        title: '오류',
        description: '동의 상태 업데이트에 실패했습니다.',
        variant: 'destructive',
      })
    } finally {
      setSelectedConsent(null)
      setActionType(null)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (pendingConsents.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-600" />
            동의가 필요한 공구가 있습니다
          </CardTitle>
          <CardDescription>
            선택된 입찰에 대한 동의 여부를 결정해주세요.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {pendingConsents.map((consent) => (
            <Card key={consent.id} className="border-l-4 border-l-orange-400">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-lg">{consent.groupbuy_title}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline">
                        {consent.bid_type === 'percentage' ? '정률' : '정액'} 입찰
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        입찰가: {consent.bid_amount.toLocaleString()}
                        {consent.bid_type === 'percentage' ? '%' : '원'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      마감까지 {consent.remaining_time || formatDistanceToNow(
                        new Date(consent.consent_deadline),
                        { addSuffix: true, locale: ko }
                      )}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleConsentAction(consent, 'agree')}
                      size="sm"
                      className="flex-1"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      동의
                    </Button>
                    <Button
                      onClick={() => handleConsentAction(consent, 'disagree')}
                      size="sm"
                      variant="outline"
                      className="flex-1"
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      거부
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>

      <AlertDialog open={!!selectedConsent && !!actionType} onOpenChange={() => {
        setSelectedConsent(null)
        setActionType(null)
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === 'agree' ? '입찰에 동의하시겠습니까?' : '입찰을 거부하시겠습니까?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedConsent && (
                <div className="space-y-2 mt-2">
                  <p className="font-semibold">{selectedConsent.groupbuy_title}</p>
                  <p>
                    입찰가: {selectedConsent.bid_amount.toLocaleString()}
                    {selectedConsent.bid_type === 'percentage' ? '%' : '원'}
                  </p>
                  {actionType === 'disagree' && (
                    <p className="text-destructive text-sm mt-2">
                      거부하시면 해당 공구에서 제외되며, 참여를 취소할 수 없습니다.
                    </p>
                  )}
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmAction}
              className={actionType === 'disagree' ? 'bg-destructive hover:bg-destructive/90' : ''}
            >
              확인
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}