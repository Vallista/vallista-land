import RoutineKit
import SwiftUI

struct SettingsView: View {
    @EnvironmentObject var model: AppModel
    @State private var tokenDraft = ""
    @State private var confirmUnlink = false
    @FocusState private var tokenFocused: Bool

    private var sync: SyncState { model.db.sync }

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    Toggle("냥노션과 동기화", isOn: $model.syncEnabled)
                    if model.syncEnabled {
                        LabeledContent("서버") {
                            TextField("https://", text: $model.serverURL)
                                .multilineTextAlignment(.trailing)
                                .keyboardType(.URL)
                                .textInputAutocapitalization(.never)
                                .autocorrectionDisabled()
                        }
                        if model.hasToken {
                            LabeledContent("개인 토큰") {
                                HStack(spacing: 10) {
                                    Text("저장됨").foregroundStyle(.secondary)
                                    Button("바꾸기", role: .destructive) { confirmUnlink = true }
                                        .buttonStyle(.borderless)
                                }
                            }
                        } else {
                            HStack {
                                SecureField("nyt_…", text: $tokenDraft)
                                    .textInputAutocapitalization(.never)
                                    .autocorrectionDisabled()
                                    .focused($tokenFocused)
                                Button("저장") {
                                    model.setToken(tokenDraft)
                                    tokenDraft = ""
                                    tokenFocused = false
                                }
                                .disabled(tokenDraft.trimmingCharacters(in: .whitespaces).isEmpty)
                            }
                        }
                    }
                } header: {
                    Text("동기화")
                } footer: {
                    Text("맥 Bento 와 같은 냥노션 계정의 개인 토큰을 넣으면 루틴·기록·타이머가 서로 맞춰져요. 토큰은 냥노션 웹 › 계정 › 개인 토큰에서 만들고, 이 기기의 키체인에만 저장돼요.")
                }

                if model.syncEnabled {
                    Section {
                        Button {
                            Task { await model.syncNow() }
                        } label: {
                            HStack {
                                Text("지금 맞추기")
                                Spacer()
                                if model.syncing { ProgressView() }
                            }
                        }
                        .disabled(model.syncing || !model.hasToken)
                        LabeledContent("마지막 동기화", value: lastSyncText)
                        LabeledContent("올릴 변경", value: sync.pendingCount == 0 ? "없음" : "\(sync.pendingCount)건")
                        if let err = sync.lastError {
                            Text(err).font(.footnote).foregroundStyle(Theme.bad)
                        }
                    } footer: {
                        Text("앱을 열 때, 고친 뒤 2초 후, 앱이 켜져 있으면 1분마다 맞춰요. 위젯에서 체크한 것은 앱을 열 때 올라가요.")
                    }
                }

                Section {
                    Toggle("주는 월요일부터", isOn: $model.mondayFirst)
                } header: {
                    Text("표시")
                } footer: {
                    Text("히트맵 줄, 주간 통계, 요일 순서에 쓰여요.")
                }

                Section("정보") {
                    LabeledContent("루틴", value: "\(model.db.activeRoutines.count)개 진행 · \(model.db.routines.count - model.db.activeRoutines.count)개 보관")
                    LabeledContent("기록", value: "\(model.db.logs.count)일치")
                    LabeledContent("버전", value: Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? "–")
                }
            }
            .navigationTitle("설정")
            .confirmationDialog("저장된 토큰을 지울까요?", isPresented: $confirmUnlink, titleVisibility: .visible) {
                Button("토큰 지우기", role: .destructive) { model.setToken("") }
            } message: {
                Text("이 기기의 기록은 그대로 남아요. 새 토큰을 넣으면 서버 기록과 다시 합쳐요.")
            }
        }
    }

    private var lastSyncText: String {
        guard let at = sync.lastSyncAt, let date = Clock.parse(at) else { return "아직 없음" }
        let f = RelativeDateTimeFormatter()
        f.locale = Locale(identifier: "ko_KR")
        f.unitsStyle = .short
        return f.localizedString(for: date, relativeTo: Date())
    }
}
