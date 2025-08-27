import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import GroupBuyList from '@/components/groupbuy/GroupBuyList';

export default function GroupBuyPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">공동구매 둘러보기</h1>
      
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="mb-8">
          <TabsTrigger value="active">진행중인 공구</TabsTrigger>
          <TabsTrigger value="completed">완료된 공구</TabsTrigger>
        </TabsList>
        
        <TabsContent value="active">
          <GroupBuyList type="active" />
        </TabsContent>
        
        <TabsContent value="completed">
          <GroupBuyList type="completed" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
