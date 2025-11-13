import {PrismaClient} from '@prisma/client'
const prisma = new PrismaClient()

async function main(){
  try{
    const r = await prisma.apps.findMany({ take: 1 })
    console.log('OK', r)
  }catch(e){
    console.error('ERR', e)
  }finally{
    await prisma.$disconnect()
  }
}

main()
