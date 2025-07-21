'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Check, User, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { voteForBid, getMyVote, getVotingResults } from '@/lib/api/votingService';
import { fetchWithAuth } from '@/lib/api/fetch';

interface Bid {
  id: number;
  seller: {
    id: number;
    username: string;
    business_name?: string;
    profile_image?: string;
    rating?: number;
  };
  bid_type: 'price' | 'percentage';
  amount: number;
  message: string;
  created_at: string;
  is_selected?: boolean;
  vote_count?: number;
}

interface BidVotingListProps {
  groupBuyId: number;
  isParticipant: boolean;
}

export function BidVotingList({ 
  groupBuyId,
  isParticipant
}: BidVotingListProps) {
  const [selectedBid, setSelectedBid] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bids, setBids] = useState<Bid[]>([]);
  const [hasVoted, setHasVoted] = useState(false);
  const [myVote, setMyVote] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Fetch bids and voting status
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch bids
        const bidsResponse = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/groupbuys/${groupBuyId}/bids/`);
        if (bidsResponse.ok) {
          const bidsData = await bidsResponse.json();
          setBids(bidsData);
        }
        
        // Check if user has voted
        const myVoteData = await getMyVote(groupBuyId);
        if (myVoteData) {
          setHasVoted(true);
          setMyVote(myVoteData.bid_id);
          setSelectedBid(myVoteData.bid_id.toString());
        }
      } catch (error) {
        console.error('Failed to fetch voting data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [groupBuyId]);

  const handleVoteSubmit = async () => {
    if (!selectedBid) {
      toast({
        variant: 'destructive',
        title: '판매자를 선택해주세요.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await voteForBid(groupBuyId, parseInt(selectedBid));
      toast({
        title: '투표가 완료되었습니다.',
      });
      setHasVoted(true);
      setMyVote(parseInt(selectedBid));
    } catch (error) {
      toast({
        variant: 'destructive',
        title: '투표 중 오류가 발생했습니다.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatAmount = (bid: Bid) => {
    if (bid.bid_type === 'percentage') {
      return `${bid.amount}% 할인`;
    }
    return `${bid.amount.toLocaleString()}원`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>입찰 내역 및 투표</span>
          {loading ? (
            <span className="text-sm text-gray-500">로딩 중...</span>
          ) : hasVoted ? (
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <Check className="w-4 h-4 mr-1" />
              투표 완료
            </Badge>
          ) : null}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">입찰 내역을 불러오고 있습니다...</p>
          </div>
        ) : bids.length === 0 ? (
          <p className="text-center text-gray-500 py-8">아직 입찰이 없습니다.</p>
        ) : (
          <>
            <RadioGroup 
              value={selectedBid} 
              onValueChange={setSelectedBid}
              disabled={hasVoted || !isParticipant}
            >
              <div className="space-y-4">
                {bids.map((bid) => (
                  <div
                    key={bid.id}
                    className={`relative border rounded-lg p-4 transition-all ${
                      selectedBid === bid.id.toString() 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    } ${hasVoted && myVote === bid.id ? 'ring-2 ring-green-500' : ''}`}
                  >
                    <div className="flex items-start gap-4">
                      <RadioGroupItem 
                        value={bid.id.toString()} 
                        id={`bid-${bid.id}`}
                        className="mt-1"
                      />
                      
                      <div className="flex-1">
                        <Label htmlFor={`bid-${bid.id}`} className="cursor-pointer">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                              {bid.seller.profile_image ? (
                                <img 
                                  src={bid.seller.profile_image} 
                                  alt={bid.seller.username}
                                  className="w-full h-full rounded-full object-cover"
                                />
                              ) : (
                                <User className="w-5 h-5 text-gray-500" />
                              )}
                            </div>
                            
                            <div>
                              <p className="font-semibold">
                                {bid.seller.business_name || bid.seller.username}
                              </p>
                              {(bid.seller as any).rating && (
                                <div className="flex items-center gap-1 text-sm text-gray-600">
                                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                  <span>{(bid.seller as any).rating.toFixed(1)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-2xl font-bold text-blue-600">
                                {formatAmount(bid)}
                              </span>
                              {bid.vote_count !== undefined && bid.vote_count > 0 && (
                                <Badge variant="secondary">
                                  {bid.vote_count}표
                                </Badge>
                              )}
                            </div>
                            
                            {bid.message && (
                              <p className="text-sm text-gray-600">{bid.message}</p>
                            )}
                            
                            <p className="text-xs text-gray-500">
                              입찰일시: {new Date(bid.created_at).toLocaleString('ko-KR')}
                            </p>
                          </div>
                        </Label>
                      </div>
                    </div>
                    
                    {hasVoted && myVote === bid.id && (
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-green-600">
                          <Check className="w-3 h-3 mr-1" />
                          내 선택
                        </Badge>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </RadioGroup>
            
            {isParticipant && !hasVoted && (
              <Button
                onClick={handleVoteSubmit}
                disabled={!selectedBid || isSubmitting}
                className="w-full mt-6"
              >
                {isSubmitting ? '처리중...' : '선택한 판매자에게 투표하기'}
              </Button>
            )}
            
            {!isParticipant && (
              <Alert className="mt-6">
                <AlertDescription>
                  공구 참여자만 투표할 수 있습니다.
                </AlertDescription>
              </Alert>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}