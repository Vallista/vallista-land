import { Modal, Spacer, Text, Toggle } from '@vallista/core'
import { VFC } from 'react'

import * as Styled from './Header.style'
import { HeaderProps, HeaderDialogVariableType } from './Header.type'
import { useHeader } from './useHeader'

const fontSizeControllerMapper = [14, 16, 18, 20]

export const Header: VFC<HeaderProps> = (props) => {
  const { fold, folding, dialog, textSize, mode, openDialog, closeDialog, changeTheme, changeTextSize } =
    useHeader(props)

  return (
    <Styled._Container fold={fold}>
      <div>
        <Styled._FoldingButton fold={fold} onClick={folding}>
          <svg
            viewBox='0 0 24 24'
            width='18'
            height='18'
            stroke='currentColor'
            strokeWidth='1.5'
            strokeLinecap='round'
            strokeLinejoin='round'
            fill='none'
            shapeRendering='geometricPrecision'
          >
            <rect x='3' y='3' width='18' height='18' rx='2' ry='2' />
            <path d='M9 3v18' />
          </svg>
        </Styled._FoldingButton>
        <Spacer />
        <Styled._SettingButton popup={dialog.visible} onClick={() => changeDialogVisible('SETTING')}>
          <svg
            viewBox='0 0 24 24'
            width='18'
            height='18'
            stroke='currentColor'
            strokeWidth='1.5'
            strokeLinecap='round'
            strokeLinejoin='round'
            fill='none'
            shapeRendering='geometricPrecision'
          >
            <circle cx='12' cy='12' r='3' />
            <path d='M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z' />
          </svg>
        </Styled._SettingButton>
      </div>
      <Styled._ThemeToggleContainer>
        <svg
          viewBox='0 0 24 24'
          width='18'
          height='18'
          stroke='currentColor'
          strokeWidth='1.5'
          strokeLinecap='round'
          strokeLinejoin='round'
          fill='none'
          shapeRendering='geometricPrecision'
        >
          <circle cx='12' cy='12' r='5' />
          <path d='M12 1v2' />
          <path d='M12 21v2' />
          <path d='M4.22 4.22l1.42 1.42' />
          <path d='M18.36 18.36l1.42 1.42' />
          <path d='M1 12h2' />
          <path d='M21 12h2' />
          <path d='M4.22 19.78l1.42-1.42' />
          <path d='M18.36 5.64l1.42-1.42' />
        </svg>
        <Toggle toggle={mode === 'DARK'} size='medium' onChange={handleDarkModeToggle} color='pink' />
        <svg
          viewBox='0 0 24 24'
          width='18'
          height='18'
          stroke='currentColor'
          strokeWidth='1.5'
          strokeLinecap='round'
          strokeLinejoin='round'
          fill='none'
          shapeRendering='geometricPrecision'
        >
          <path d='M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z' />
        </svg>
      </Styled._ThemeToggleContainer>
      <Modal.Modal active={dialog.visible}>
        <Modal.Body>
          <Modal.Header>
            <Modal.Title>설정</Modal.Title>
            <Spacer y={2} />
            <Styled._EnvironmentContainer>
              <Text weight={500}>텍스트 크기</Text>
              <Styled._SelectGaugeWrapper>
                {fontSizeControllerMapper.map((it, idx, arr) => (
                  <Styled._SelectGauge
                    key={idx}
                    value={it}
                    idx={idx}
                    max={arr.length}
                    onClick={() => changeREM(it)}
                    selected={textSize}
                  />
                ))}
              </Styled._SelectGaugeWrapper>
            </Styled._EnvironmentContainer>
          </Modal.Header>
        </Modal.Body>
        <Modal.Actions>
          <Modal.Action onClick={() => changeDialogVisible('SETTING')}>
            <Text>닫기</Text>
          </Modal.Action>
        </Modal.Actions>
      </Modal.Modal>
    </Styled._Container>
  )

  function handleDarkModeToggle(state: boolean): void {
    if (state) {
      changeTheme('DARK')
    } else {
      changeTheme('LIGHT')
    }
  }

  function changeREM(size: number): void {
    changeTextSize(size)
  }

  function changeDialogVisible(type: HeaderDialogVariableType): void {
    if (dialog.visible) closeDialog()
    else openDialog(type)
  }
}
