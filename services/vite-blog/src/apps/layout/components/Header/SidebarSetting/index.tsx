import HeaderSettingBtn from '@/assets/icons/header-setting-btn.svg?react'

import * as Styled from './index.style'
import { useSidebarSetting } from './useSidebarSetting'
import { Modal, Spacer, Text } from '@vallista/design-system'
import { FONT_SIZES } from '../utils'

export const SidebarSetting = () => {
  const { dialog, changeDialogVisible, changeREM, textSize } = useSidebarSetting()

  return (
    <>
      <Styled._Button popup={dialog.visible} onClick={() => changeDialogVisible('SETTING')}>
        <HeaderSettingBtn />
      </Styled._Button>
      <Modal.Modal active={dialog.visible}>
        <Modal.Body>
          <Modal.Header>
            <Modal.Title>설정</Modal.Title>
            <Spacer y={2} />
            <Styled._EnvironmentContainer>
              <Text weight={500}>텍스트 크기</Text>
              <Styled._SelectGaugeWrapper>
                {FONT_SIZES.map((it, idx, arr) => (
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
    </>
  )
}
