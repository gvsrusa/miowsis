export default async function PortfolioDetailPageWrapper({ 
  params 
}: { 
  params: Promise<{ portfolioId: string }>
}) {
  const { portfolioId } = await params
  const PortfolioDetailPage = (await import('./client')).default
  
  return <PortfolioDetailPage params={{ portfolioId }} />
}