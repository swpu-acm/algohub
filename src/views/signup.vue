<script setup lang="ts">
import { reactive, type Ref, ref } from "vue";
import { useToast } from 'primevue/usetoast';
import { useRouter } from "vue-router";
import { useAccountStore } from "../scripts/store";
import VuePictureCropper, { cropper } from 'vue-picture-cropper'
import * as api from "@/scripts/api";
import { type FileUploadSelectEvent, useConfirm } from "primevue";

const toast = useToast();
const confirm = useConfirm();
const router = useRouter();
const accountStore = useAccountStore();

const activeStep = ref("1");
const isShowAvatarCutter = ref<boolean>(false);
const avatarString = ref<string>('');
const croppedAvatar = ref<string>('');

interface RegisterForm<T> {
  username?: T;
  email?: T;
  password?: T;
  retyped_password?: T;
  terms?: T;
}

const registerResolver = ({ values }: { values: RegisterForm<string> }) => {
  const errors: RegisterForm<{ message: string }[]> = {};

  if (!values.username) {
    errors.username = [{ message: "Username is required." }]
  }
  if (!values.email) {
    errors.email = [{ message: "Email is required." }]
  }
  if (!values.password) {
    errors.password = [{ message: "Password is required." }]
  }
  if (!values.retyped_password || values.password !== values.retyped_password) {
    errors.retyped_password = [{ message: "Passwords do not match." }]
  }
  if (!values.terms) {
    errors.terms = [{ message: "You must agree to the terms and conditions." }]
  }

  return { errors };
}

const registerInitialValues = reactive({
  username: "",
  email: "",
  password: "",
  terms: false,
})

const inProgress = ref(false);
const onRegister = async ({ valid, states }: { valid: boolean, states: RegisterForm<Ref<string>> }) => {
  if (!valid) return;

  if (inProgress.value) return;
  inProgress.value = true;
  const res = await api.register({
    username: states.username!.value,
    email: states.email!.value,
    password: states.password!.value,
  })
  if (!res.success) {
    inProgress.value = false;
    return toast.add({ severity: "error", summary: "Registration failed", detail: res.message });
  }
  accountStore.account = {
    username: states.username!.value,
    email: states.email!.value,
    ...res.data!
  };
  inProgress.value = false;

  if (res.success) {
    toast.add({
      severity: "success", summary: "Registered successfully", detail: "You are now logged in, perhaps filled with your profile.", life: 3000
    });
    activeStep.value = "2";
  }
  else
    toast.add({ severity: "error", summary: "Registration failed", detail: res.message, life: 3000 });
}

const uploading = ref(false);
const selectAvatar = async (event: FileUploadSelectEvent) => {
  uploading.value = true
  inProgress.value = true
  avatarString.value = ''

  const file = event.files[0];
  const reader = new FileReader()
  reader.readAsDataURL(file)
  reader.onload = () => {
    // Update the picture source of the `img` prop
    avatarString.value = String(reader.result)

    // Show the cutter
    isShowAvatarCutter.value = true
    confirm.require({
      group: 'templating',
      header: 'Crop your avatar',
      rejectProps: {
        label: 'Cancel',
        icon: 'pi pi-times',
        outlined: true,
        size: 'small'
      },
      acceptProps: {
        label: 'Save',
        icon: 'pi pi-check',
        size: 'small'
      },
      accept: async () => {
        if (!cropper) return
        croppedAvatar.value = cropper.getDataURL();
        const cropped = await cropper.getFile({
          fileName: file.name,
        })
        if (cropped) {
          const res = await api.uploadContent({
            auth: accountStore.auth!,
            owner: `account:${accountStore.account!.id}`,
            file: cropped,
          })
          if (!res.success) {
            inProgress.value = false
            return toast.add({ severity: "error", summary: "Upload failed", detail: res.message });
          }
          accountStore.account!.avatar = res.data!.id;
          toast.add({ severity: "success", summary: "Avatar uploaded", detail: "Your new avatar has been saved.", life: 3000 });
        } else {
          toast.add({ severity: "error", summary: "Crop failed", detail: "Failed to initialize cropper." });
        }
        uploading.value = false
        inProgress.value = false
      },
      reject: () => {
        avatarString.value = ''
        uploading.value = false
        inProgress.value = false
      }
    })
  }
}

const sexOptions = [
  { name: 'Male', value: true },
  { name: 'Female', value: false },
]

interface UpdateProfileForm<T, S, D> {
  nickname?: T;
  signature?: T;
  sex?: S;
  birthday?: D;
  avatar?: T;
}

const updateProfileResolver = ({ values }: { values: UpdateProfileForm<string, boolean, Date> }) => {
  const errors: UpdateProfileForm<{ message: string }[], { message: string }[], { message: string }[]> = {};

  if (values.nickname && values.nickname.length > 16) {
    errors.nickname = [{ message: "Nickname is too long (16 characters max)." }]
  }
  if (values.signature && values.signature.length > 64) {
    errors.signature = [{ message: "Signature is too long (64 characters max)." }]
  }
}

const onUpdateProfile = async ({ valid, states }: {
  valid: boolean,
  states: UpdateProfileForm<Ref<string>, Ref<boolean>, Ref<Date>>
}) => {
  if (!valid) return;

  inProgress.value = true;
  const res = await api.updateProfile({
    id: accountStore.account!.id!,
    token: accountStore.account!.token!,
    profile: {
      nickname: states.nickname?.value,
      signature: states.signature?.value,
      sex: states.sex?.value,
      birthday: states.birthday?.value?.toISOString().replace('Z', ''),
      avatar: accountStore.account!.avatar,
    }
  })
  if (!res.success) {
    inProgress.value = false;
    return toast.add({ severity: "error", summary: "Update failed", detail: res.message });
  }
  toast.add({ severity: "success", summary: "Profile updated", detail: "Your profile has been updated.", life: 3000 });
  accountStore.mergeProfile({
    nickname: states.nickname!.value,
    signature: states.signature!.value,
    sex: states.sex!.value,
    birthday: states.birthday!.value.toISOString().replace('Z', ''),
  })

  inProgress.value = false;

  activeStep.value = "3";
}

interface CompleteForm<T> {
  name?: T,
  student_id?: T,
  school?: T,
  college?: T,
  major?: T,
}

const completeResolver = ({ values }: { values: CompleteForm<string> }) => {
  const errors: CompleteForm<{ message: string }[]> = {};

  if (!values.name) {
    errors.name = [{ message: "Name is required." }];
  } else if (values.name.length > 16) {
    errors.name = [{ message: "Name is too long (16 characters max)." }]
  }

  if (!values.student_id) {
    errors.student_id = [{ message: "Student ID is required." }];
  } else if (values.student_id.length !== 12) {
    errors.student_id = [{ message: "Student ID is invalid (12 characters expected)." }]
  }

  if (!values.school) {
    errors.school = [{ message: "School is required." }]
  }
  if (!values.college) {
    errors.college = [{ message: "College is required." }]
  }
  if (!values.major) {
    errors.major = [{ message: "Major is required." }]
  }

  return { errors };
}

const completeInitialValues = reactive({
  name: "",
  student_id: "",
  school: "西南石油大学",
  college: "",
  major: "",
})

const onComplete = async ({ valid, states }: { valid: boolean, states: CompleteForm<Ref<string>> }) => {
  if (!valid) return;

  inProgress.value = true;
  const res = await api.updateProfile({
    id: accountStore.account!.id!,
    token: accountStore.account!.token!,
    profile: {
      name: states.name!.value,
      student_id: states.student_id!.value,
      school: states.school!.value,
      college: states.college!.value,
      major: states.major!.value,
    }
  })
  if (!res.success) {
    toast.add({ severity: "error", summary: "Update failed", detail: res.message, life: 3000 });
  } else {
    toast.add({ severity: "success", summary: "Profile updated", detail: "Your profile has been updated.", life: 3000 });
    accountStore.mergeProfile({
      name: states.name!.value,
      student_id: states.student_id!.value,
      school: states.school!.value,
      college: states.college!.value,
      major: states.major!.value,
    })
  }
  inProgress.value = false;
  router.push('/')
}

const path = [
  { label: 'Home', link: '/' },
  { label: 'Sign Up' }
]
</script>

<template>
  <div class="w-full h-full flex flex-col">
    <UniversalToolBar :path></UniversalToolBar>
    <Stepper v-model:value="activeStep" linear class="my-auto mx-auto">
      <StepList>
        <Step value="1">Signup</Step>
        <Step value="2">Profile</Step>
        <Step value="3">Complete</Step>
      </StepList>
      <StepPanels>
        <StepPanel value="1">
          <Card class="flex w-full h-full items-center justify-center flex-col">
            <template #title>Sign Up</template>
            <template #subtitle>Create a new account with AlgoHub</template>
            <template #content>
              <Form v-slot="$form" :initialValues=registerInitialValues :resolver=registerResolver @submit="onRegister"
                class="flex flex-col gap-4 justify-center items-center">
                <div class="flex flex-col gap-1 w-full">
                  <InputText name="username" type="text" placeholder="Username" fluid />
                  <Message v-if="$form.username?.invalid" severity="error" size="small" variant="simple">{{
                    $form.username.error.message }}</Message>
                </div>
                <div class="flex flex-col gap-1 w-full">
                  <InputText name="email" type="text" placeholder="Email" fluid />
                  <Message v-if="$form.email?.invalid" severity="error" size="small" variant="simple">{{
                    $form.email.error.message }}</Message>
                </div>
                <div class="flex flex-col gap-1 w-full">
                  <Password name="password" type="text" placeholder="Password" :feedback="false" toggleMask fluid />
                  <Message v-if="$form.password?.invalid" severity="error" size="small" variant="simple">{{
                    $form.password.error.message }}</Message>
                </div>
                <div class="flex flex-col gap-1 w-full">
                  <Password name="retyped_password" type="text" placeholder="Retype Password" :feedback="false"
                    toggleMask fluid />
                  <Message v-if="$form.retyped_password?.invalid" severity="error" size="small" variant="simple">{{
                    $form.retyped_password.error.message }}</Message>
                </div>
                <div class="flex flex-col gap-1 w-full">
                  <div class="flex items-center gap-2">
                    <Checkbox inputId="terms" name="terms" binary />
                    <label for="terms" class="text-sm">I have read and agree to the <a href="#" class="underline">Affero
                        General Public License v3</a>.</label>
                  </div>
                  <Message v-if="$form.terms?.invalid" severity="error" size="small" variant="simple">{{
                    $form.terms.error.message }}</Message>
                </div>
                <p>Already have an account? <a @click="router.push('/login')" class="underline">Login</a></p>
                <Button type="submit" label="Register" class="w-full" :loading="inProgress" secondary></Button>
              </Form>
            </template>
          </Card>
        </StepPanel>
        <StepPanel value="2" class="h-full">
          <ConfirmDialog group="templating">
            <template #message>
              <VuePictureCropper :boxStyle="{
                width: '100%',
                height: '100%',
                margin: 'auto',
              }" :img="avatarString" :options="{
                viewMode: 1,
                dragMode: 'crop',
                aspectRatio: 1,
              }" :presetMode="{
                width: 500,
                height: 500,
              }" />
            </template>
          </ConfirmDialog>

          <Card class="m-auto flex basis-[40rem] w-full h-full items-center justify-center flex-col">
            <template #title>Update profile</template>
            <template #subtitle>Congratulates on your registration!</template>
            <template #content>
              <Form v-slot="$form" :resolver=updateProfileResolver @submit="onUpdateProfile"
                class="flex flex-col gap-4 justify-center items-center">
                <div class="flex flex-row gap-4 w-full justify-center items-center">
                  <label for="avatar" class="text-sm">Upload Avatar</label>
                  <input name="avatar" class="!hidden"></input>
                  <div class="flex flex-col gap-2 w-full justify-center items-center">
                    <FileUpload v-show="!uploading" @select="selectAvatar" name="avatar" mode="basic"
                      accept="image/jpg, image/jpeg, image/png, image/gif" customUpload auto chooseLabel="Select Avatar"
                      :maxFileSize="1024 * 1024 * 2" :multiple="false" severity="secondary">
                    </FileUpload>
                    <Button v-show="uploading" label="Uploading..." loading></Button>
                    <Image v-if="croppedAvatar" :src="croppedAvatar" class="shadow-md rounded-xl w-full sm:w-32" preview
                      imageClass="rounded-full"></Image>
                  </div>
                </div>
                <div class="flex flex-col gap-1 w-full">
                  <InputText name="nickname" type="text" placeholder="Nickname" fluid />
                  <Message v-if="$form.nickname?.invalid" severity="error" size="small" variant="simple">{{
                    $form.nickname.error.message }}</Message>
                </div>
                <div class="flex flex-col gap-1 w-full">
                  <InputText name="signature" type="text" placeholder="Personalized Signature" fluid />
                  <Message v-if="$form.signature?.invalid" severity="error" size="small" variant="simple">{{
                    $form.signature.error.message }}</Message>
                </div>
                <div class="flex flex-col gap-1 w-full">
                  <Select name="sex" :options="sexOptions" optionLabel="name" placeholder="Biological Sex"
                    :optionValue="v => v.value" class="w-full"></Select>
                  <Message v-if="$form.sex?.invalid" severity="error" size="small" variant="simple">{{
                    $form.sex.error.message }}</Message>
                </div>
                <div class="flex flex-col gap-1 w-full">
                  <DatePicker name="birthday" placeholder="Birthday" fluid />
                  <Message v-if="$form.birthday?.invalid" severity="error" size="small" variant="simple">{{
                    $form.birthday.error.message }}</Message>
                </div>
                <p>Can't wait to enjoy? <a @click="router.push('/')" class="underline">Skip</a></p>
                <Button type="submit" label="Save" class="w-full" :loading="inProgress" secondary></Button>
              </Form>
            </template>
          </Card>
        </StepPanel>
        <StepPanel value="3" class="h-full">
          <Card class="m-auto flex basis-[40rem] w-full h-full items-center justify-center flex-col">
            <template #title>Activate your account</template>
            <template #subtitle>Complete your identification to activate your account</template>
            <template #content>
              <Form v-slot="$form" :initialValues=completeInitialValues :resolver=completeResolver @submit="onComplete"
                class="flex flex-col gap-4 justify-center items-center">
                <div class="flex flex-col gap-1 w-full">
                  <InputText name="name" type="text" placeholder="Real Name" fluid />
                  <Message v-if="$form.name?.invalid" severity="error" size="small" variant="simple">{{
                    $form.name.error.message }}</Message>
                </div>
                <div class="flex flex-col gap-1 w-full">
                  <InputText name="student_id" type="text" placeholder="Student ID" fluid />
                  <Message v-if="$form.student_id?.invalid" severity="error" size="small" variant="simple">{{
                    $form.student_id.error.message }}</Message>
                </div>
                <div class="flex flex-col gap-1 w-full">
                  <InputText name="school" type="text" placeholder="School" fluid />
                  <Message v-if="$form.school?.invalid" severity="error" size="small" variant="simple">{{
                    $form.school.error.message }}</Message>
                </div>
                <div class="flex flex-col gap-1 w-full">
                  <InputText name="college" type="text" placeholder="College" fluid />
                  <Message v-if="$form.college?.invalid" severity="error" size="small" variant="simple">{{
                    $form.college.error.message }}</Message>
                </div>
                <div class="flex flex-col gap-1 w-full">
                  <InputText name="major" type="text" placeholder="Major" fluid />
                  <Message v-if="$form.major?.invalid" severity="error" size="small" variant="simple">{{
                    $form.major.error.message }}</Message>
                </div>
                <p>Activate your account later? <a @click="router.push('/')" class="underline">Stay inactive</a></p>
                <Button type="submit" label="Activate" class="w-full" :disabled="inProgress" secondary></Button>
              </Form>
            </template>
          </Card>
        </StepPanel>
      </StepPanels>
    </Stepper>
  </div>
</template>
