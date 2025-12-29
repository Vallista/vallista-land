import { useEffect, useState } from 'react'

import {
  Badge,
  Button,
  Capacity,
  Checkbox,
  Collapse,
  Container,
  Footer,
  Image,
  Input,
  LoadingDots,
  Modal,
  Note,
  Progress,
  Radio,
  RadioGroup,
  Select,
  ShowMore,
  Snippet,
  Spacer,
  Spinner,
  Switch,
  Tag,
  Tags,
  Text,
  Tooltip,
  Video,
  useModal,
  useTheme,
  copy,
  ThemeProvider
} from '@vallista/design-system'

import './App.css'

function AppContent() {
  const [inputValue, setInputValue] = useState('')
  const [checkboxChecked, setCheckboxChecked] = useState(false)
  const [radioValue, setRadioValue] = useState('option1')
  const [switchValue, setSwitchValue] = useState(false)
  const [progressValue, setProgressValue] = useState(50)
  const [progressValues, setProgressValues] = useState([25, 50, 75, 30, 90])
  const [tags, setTags] = useState(['React', 'TypeScript', 'Design System'])
  const [showMoreExpanded, setShowMoreExpanded] = useState(false)

  // ThemeProvider의 useTheme 훅 사용
  const { currentTheme, changeTheme } = useTheme()

  // Hydration 테스트를 위한 상태들
  const [isHydrated, setIsHydrated] = useState(false)
  const [serverTime, setServerTime] = useState<string>('서버 시간 로딩 중...')
  const [clientTime, setClientTime] = useState<string>('클라이언트 시간 로딩 중...')
  const [localStorageValue, setLocalStorageValue] = useState<string>('로컬스토리지 로딩 중...')

  const { active, open, close } = useModal()

  // 프로그래스 랜덤 변경 함수들
  const handleRandomProgress = () => {
    setProgressValue(Math.floor(Math.random() * 101))
  }

  const handleRandomAllProgress = () => {
    setProgressValues(progressValues.map(() => Math.floor(Math.random() * 101)))
  }

  const handleRandomSingleProgress = (index: number) => {
    const newValues = [...progressValues]
    newValues[index] = Math.floor(Math.random() * 101)
    setProgressValues(newValues)
  }

  // Hydration 테스트를 위한 useEffect
  useEffect(() => {
    // Hydration 완료 표시
    setIsHydrated(true)

    // 클라이언트 시간 설정
    setClientTime(new Date().toLocaleString('ko-KR'))

    // 로컬스토리지 테스트
    try {
      const stored = localStorage.getItem('design-system-test')
      if (stored) {
        setLocalStorageValue(stored)
      } else {
        const testValue = '디자인시스템 테스트 값'
        localStorage.setItem('design-system-test', testValue)
        setLocalStorageValue(testValue)
      }
    } catch {
      setLocalStorageValue('로컬스토리지 접근 불가')
    }

    // 서버 시간 시뮬레이션 (실제로는 서버에서 받아올 값)
    setTimeout(() => {
      setServerTime(new Date().toLocaleString('ko-KR'))
    }, 1000)
  }, [])

  const handleCopy = () => {
    copy(
      'Hello from Design System!',
      () => console.log('복사 성공!'),
      () => console.log('복사 실패!')
    )
  }

  const removeTag = (id: string) => {
    setTags(tags.filter((tag) => tag !== id))
  }

  return (
    <div className='app-container'>
      {/* Fixed Header */}
      <header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '60px',
          backgroundColor: 'var(--primary-background)',
          borderBottom: '1px solid var(--primary-accent-3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          zIndex: 1000,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
        }}
      >
        {/* Left: Title */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Text size={20} weight={600}>
            Vallista Design System
          </Text>
        </div>

        {/* Right: Theme Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Text size={14} weight={500}>
            {currentTheme === 'LIGHT' ? '라이트' : '다크'} 모드
          </Text>
          <Switch
            active={currentTheme === 'DARK'}
            onChange={() => changeTheme(currentTheme === 'LIGHT' ? 'DARK' : 'LIGHT')}
            size='small'
          />
        </div>
      </header>

      {/* Main Content with top margin for fixed header */}
      <div className='app-content' style={{ marginTop: '80px' }}>
        <div className='app-title'>
          <Text size={32} weight={700}>
            Vallista Design System 테스트
          </Text>
        </div>

        {/* 기본 컴포넌트들 */}
        <section className='section'>
          <div className='section-title'>
            <Text size={24} weight={600}>
              기본 컴포넌트들
            </Text>
          </div>

          <div className='component-group'>
            <Button size='small' color='primary'>
              Small Primary
            </Button>
            <Button size='medium' color='secondary'>
              Medium Secondary
            </Button>
            <Button size='large' color='success'>
              Large Success
            </Button>
            <Button size='medium' color='error'>
              Error Button
            </Button>
            <Button size='medium' color='primary'>
              Primary Button
            </Button>
          </div>

          <div className='component-group'>
            <Badge type='primary' variant='contrast'>
              Primary
            </Badge>
            <Badge type='secondary'>Secondary</Badge>
            <Badge type='success'>Success</Badge>
            <Badge type='error'>Error</Badge>
            <Badge type='warning'>Warning</Badge>
            <Badge type='primary' variant='outline'>
              Outline
            </Badge>
          </div>
        </section>

        {/* 폼 컴포넌트들 */}
        <section className='section'>
          <div className='section-title'>
            <Text size={24} weight={600}>
              폼 컴포넌트들
            </Text>
          </div>

          <div className='component-item'>
            <Input placeholder='텍스트를 입력하세요' value={inputValue} onChange={setInputValue} size='medium' />
          </div>

          <div className='component-item'>
            <Checkbox
              checked={checkboxChecked}
              onChange={() => setCheckboxChecked(!checkboxChecked)}
              label='체크박스 라벨'
            >
              체크박스 캡션
            </Checkbox>
          </div>

          <div className='component-item'>
            <RadioGroup value={radioValue} onChange={setRadioValue}>
              <Radio value='option1'>옵션 1</Radio>
              <Radio value='option2'>옵션 2</Radio>
              <Radio value='option3'>옵션 3</Radio>
            </RadioGroup>
          </div>

          <div className='component-item'>
            <Switch active={switchValue} onChange={setSwitchValue} label='스위치 라벨 (라벨 클릭 가능)' />
          </div>

          <div className='component-item'>
            <Switch active={switchValue} onChange={setSwitchValue} size='small' label='Small Switch (라벨 클릭 가능)' />
          </div>

          <div className='component-item'>
            <Switch
              active={switchValue}
              onChange={setSwitchValue}
              size='medium'
              label='Medium Switch (라벨 클릭 가능)'
            />
          </div>

          <div className='component-item'>
            <Switch active={switchValue} onChange={setSwitchValue} size='large' label='Large Switch (라벨 클릭 가능)' />
          </div>

          <div className='component-item'>
            <Switch active={false} onChange={() => {}} disabled label='Disabled Switch' />
          </div>
        </section>

        {/* 상태 표시 컴포넌트들 */}
        <section className='section'>
          <div className='section-title'>
            <Text size={24} weight={600}>
              상태 표시 컴포넌트들
            </Text>
          </div>

          <div className='component-item'>
            <LoadingDots />
          </div>

          <div className='component-item'>
            <Spinner size='small' />
            <span className='component-label'>Small Spinner</span>
          </div>

          <div className='component-item'>
            <Spinner size='medium' />
            <span className='component-label'>Medium Spinner</span>
          </div>

          <div className='component-item'>
            <Spinner size='large' />
            <span className='component-label'>Large Spinner</span>
          </div>

          <div className='component-item'>
            <Progress value={progressValue} max={100} />
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <Button size='small' onClick={() => setProgressValue(Math.max(0, progressValue - 10))}>
                감소
              </Button>
              <Button size='small' onClick={() => setProgressValue(Math.min(100, progressValue + 10))}>
                증가
              </Button>
              <Button size='small' onClick={handleRandomProgress}>
                랜덤
              </Button>
            </div>
            <span className='component-label'>Progress: {progressValue}%</span>
          </div>

          <div className='component-item'>
            <div
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}
            >
              <h4>랜덤 프로그레스</h4>
              <Button size='small' onClick={handleRandomAllProgress}>
                전체 랜덤
              </Button>
            </div>
            {progressValues.map((value, index) => (
              <div key={index} style={{ marginBottom: '12px' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '4px'
                  }}
                >
                  <span>프로그레스 {index + 1}</span>
                  <Button size='small' onClick={() => handleRandomSingleProgress(index)}>
                    랜덤
                  </Button>
                </div>
                <Progress value={value} max={100} />
                <div style={{ fontSize: '12px', color: '#666' }}>값: {value}%</div>
              </div>
            ))}
          </div>

          <div className='component-item'>
            <Capacity value={75} />
            <span className='component-label'>Capacity</span>
          </div>
        </section>

        {/* 데이터 표시 컴포넌트들 */}
        <section className='section'>
          <div className='section-title'>
            <Text size={24} weight={600}>
              데이터 표시 컴포넌트들
            </Text>
          </div>

          <div className='component-item'>
            <Note type='primary'>기본 노트입니다.</Note>
          </div>

          <div className='component-item'>
            <Note type='success'>성공 노트입니다.</Note>
          </div>

          <div className='component-item'>
            <Note type='warning'>경고 노트입니다.</Note>
          </div>

          <div className='component-item'>
            <Note type='error'>에러 노트입니다.</Note>
          </div>

          <div className='component-item'>
            <Snippet text={['npm install @vallista/design-system']} />
          </div>

          <div className='component-item'>
            <Snippet text={['git clone https://github.com/vallista/design-system.git']} fill />
          </div>

          <div className='component-item'>
            <div>
              <p>
                이것은 매우 긴 텍스트입니다. ShowMore 컴포넌트를 사용하면 긴 텍스트를 접었다 펼 수 있습니다. 이 기능은
                긴 콘텐츠를 효율적으로 관리할 때 유용합니다.
              </p>
              <ShowMore expanded={showMoreExpanded} onClick={() => setShowMoreExpanded(!showMoreExpanded)} />
            </div>
          </div>
        </section>

        {/* 레이아웃 컴포넌트들 */}
        <section className='section'>
          <div className='section-title'>
            <Text size={24} weight={600}>
              레이아웃 컴포넌트들
            </Text>
          </div>

          <div className='component-item'>
            <Container>
              <Text>Container 안의 콘텐츠입니다.</Text>
            </Container>
          </div>

          <div className='component-item'>
            <Spacer />
            <Text>Spacer로 간격을 만들었습니다.</Text>
          </div>

          <div className='component-item'>
            <Tags>
              {tags.map((tag) => (
                <Tag key={tag} hasRemove onRemove={removeTag}>
                  {tag}
                </Tag>
              ))}
            </Tags>
          </div>
        </section>

        {/* 인터랙티브 컴포넌트들 */}
        <section className='section'>
          <div className='section-title'>
            <Text size={24} weight={600}>
              인터랙티브 컴포넌트들
            </Text>
          </div>

          <div className='component-item'>
            <Select value={radioValue} onChange={setRadioValue}>
              <option value='option1'>옵션 1</option>
              <option value='option2'>옵션 2</option>
              <option value='option3'>옵션 3</option>
            </Select>
          </div>

          <div className='component-item'>
            <Collapse title='접을 수 있는 섹션' subtitle='부제목입니다'>
              <Text>이 내용은 접었다 펼 수 있습니다.</Text>
            </Collapse>
          </div>

          <div className='component-item'>
            <Tooltip text='이것은 툴팁입니다' position='top'>
              <Button>위쪽 툴팁</Button>
            </Tooltip>
            <Tooltip text='이것은 툴팁입니다' position='bottom'>
              <Button>아래쪽 툴팁</Button>
            </Tooltip>
            <Tooltip text='이것은 툴팁입니다' position='left'>
              <Button>왼쪽 툴팁</Button>
            </Tooltip>
            <Tooltip text='이것은 툴팁입니다' position='right'>
              <Button>오른쪽 툴팁</Button>
            </Tooltip>
          </div>

          <div className='component-item'>
            <Button onClick={open}>모달 열기</Button>
          </div>

          <div className='component-item'>
            <Button onClick={handleCopy}>복사 테스트</Button>
          </div>

          <div className='component-item'>
            <Button onClick={() => {}}>기본 토스트</Button>
            <Button onClick={() => {}}>성공 토스트</Button>
            <Button onClick={() => {}}>에러 토스트</Button>
          </div>
        </section>

        {/* 미디어 컴포넌트들 */}
        <section className='section'>
          <div className='section-title'>
            <Text size={24} weight={600}>
              미디어 컴포넌트들
            </Text>
          </div>

          <div className='component-item'>
            <h4>이미지 컴포넌트</h4>
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              <div>
                <Text size={14} weight={500}>
                  기본 이미지
                </Text>
                <Image src='https://picsum.photos/300/200?random=1' width={300} height={200} />
              </div>
              <div>
                <Text size={14} weight={500}>
                  작은 이미지
                </Text>
                <Image src='https://picsum.photos/200/150?random=2' width={200} height={150} />
              </div>
              <div>
                <Text size={14} weight={500}>
                  큰 이미지
                </Text>
                <Image src='https://picsum.photos/400/250?random=3' width={400} height={250} />
              </div>
            </div>
          </div>

          <div className='component-item'>
            <h4>비디오 컴포넌트</h4>
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              <div>
                <Text size={14} weight={500}>
                  기본 비디오
                </Text>
                <Video
                  src='https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
                  poster='https://picsum.photos/400/225?random=4'
                  width={400}
                  height={225}
                />
              </div>
              <div>
                <Text size={14} weight={500}>
                  작은 비디오
                </Text>
                <Video
                  src='https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4'
                  poster='https://picsum.photos/300/169?random=5'
                  width={300}
                  height={169}
                />
              </div>
            </div>
          </div>

          <div className='component-item'>
            <h4>비디오 컨트롤 테스트</h4>
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              <div>
                <Text size={14} weight={500}>
                  자동재생 비디오
                </Text>
                <Video
                  src='https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
                  poster='https://picsum.photos/350/197?random=6'
                  width={350}
                  height={197}
                  autoPlay
                  muted
                />
              </div>
              <div>
                <Text size={14} weight={500}>
                  루프 비디오
                </Text>
                <Video
                  src='https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4'
                  poster='https://picsum.photos/350/197?random=7'
                  width={350}
                  height={197}
                  loop
                  muted
                />
              </div>
            </div>
          </div>

          <div className='component-item'>
            <h4>에러 케이스 테스트</h4>
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              <div>
                <Text size={14} weight={500}>
                  잘못된 이미지 URL
                </Text>
                <Image src='https://invalid-url-that-does-not-exist.com/image.jpg' width={300} height={200} />
              </div>
              <div>
                <Text size={14} weight={500}>
                  잘못된 비디오 URL
                </Text>
                <Video
                  src='https://invalid-url-that-does-not-exist.com/video.mp4'
                  poster='https://picsum.photos/300/169?random=8'
                  width={300}
                  height={169}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Hydration 테스트 */}
        <section className='section'>
          <div className='section-title'>
            <Text size={24} weight={600}>
              Hydration 테스트
            </Text>
          </div>

          <div className='hydration-status'>
            <Text size={16} weight={600}>
              Hydration 상태
            </Text>
          </div>

          <div className='hydration-status-small'>
            <Text>{isHydrated ? '✅ Hydration 완료' : '⏳ Hydration 진행 중...'}</Text>
          </div>

          <div className='hydration-info'>
            <div className='hydration-info-item'>
              <span className='hydration-label'>서버 시간:</span>
              <span>{serverTime}</span>
            </div>
            <div className='hydration-info-item'>
              <span className='hydration-label'>클라이언트 시간:</span>
              <span>{clientTime}</span>
            </div>
            <div className='hydration-info-item'>
              <span className='hydration-label'>로컬스토리지:</span>
              <span>{localStorageValue}</span>
            </div>
          </div>

          <div className='component-item'>
            <Input
              placeholder={isHydrated ? 'Hydration 완료 후 입력 가능' : 'Hydration 중...'}
              disabled={!isHydrated}
            />
          </div>
        </section>

        {/* Footer */}
        <Footer>
          <Text>Footer 내용</Text>
        </Footer>
      </div>

      {/* Modal */}
      {active && (
        <Modal active={active} onClose={close}>
          <div>
            <h2>모달 제목</h2>
            <p>모달 부제목입니다</p>
            <div style={{ marginTop: '20px' }}>
              <Text>이것은 모달의 본문 내용입니다.</Text>
            </div>
            <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <Button onClick={close}>닫기</Button>
              <Button color='primary' onClick={close}>
                확인
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  )
}

export default App
