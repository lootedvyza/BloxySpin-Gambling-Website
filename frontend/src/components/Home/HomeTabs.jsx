import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
const styles =
  "ml-auto cursor-pointer rounded-3xl border-none bg-transparent px-4 py-2.5 text-sm font-semibold text-[#484B5E] transition-opacity hover:opacity-80 active:opacity-100 data-[state=active]:bg-[#292F45] data-[state=active]:text-white";
export const HomeTabs = () => {
  return (
    <Tabs defaultValue="0" className="mt-10">
      <TabsList>
        <TabsTrigger value="0" className={styles}>
          Live Bets
        </TabsTrigger>
        <TabsTrigger value="1" className={styles}>
          Luckiest
        </TabsTrigger>
        <TabsTrigger value="2" className={styles}>
          Biggest
        </TabsTrigger>
      </TabsList>

      <TabsContent value="0"></TabsContent>
      <TabsContent value="1"></TabsContent>
      <TabsContent value="2"></TabsContent>
    </Tabs>
  );
};
