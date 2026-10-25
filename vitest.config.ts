import { defineConfig } from 'vitest/config'

// 테스트는 화면 없이 계산·표시 함수만 확인하므로 가벼운 설정만 쓴다
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
})
