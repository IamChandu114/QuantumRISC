`timescale 1ns / 1ps

module pipeline_cpu_complete(

    input logic clk,
    input logic reset

);

//==========================================================
// Program Counter
//==========================================================

logic [31:0] pc_current;
logic [31:0] pc_next;

//==========================================================
// Instruction Fetch
//==========================================================

logic [31:0] instruction;

//==========================================================
// IF/ID Pipeline Register
//==========================================================

logic [31:0] if_pc;
logic [31:0] if_instruction;

//==========================================================
// Decoder
//==========================================================

logic [6:0] opcode;
logic [4:0] rd;
logic [2:0] funct3;
logic [4:0] rs1;
logic [4:0] rs2;
logic [6:0] funct7;

//==========================================================
// Control Unit
//==========================================================

logic RegWrite;
logic MemRead;
logic MemWrite;
logic MemtoReg;
logic ALUSrc;
logic Branch;
logic Jump;
logic [1:0] ALUOp;

//==========================================================
// Register File
//==========================================================

logic [31:0] read_data1;
logic [31:0] read_data2;

//==========================================================
// Immediate Generator
//==========================================================

logic [31:0] immediate;

//==========================================================
// Execute Stage
//==========================================================

logic [3:0] alu_ctrl_signal;
logic [31:0] alu_result;
logic zero;
logic [31:0] alu_input_b;

//==========================================================
// Write Back
//==========================================================

logic [31:0] writeback_data;

//==========================================================
// PC
//==========================================================

pc PC(

    .clk(clk),
    .reset(reset),
    .enable(1'b1),
    .pc_next(pc_next),
    .pc_current(pc_current)

);

assign pc_next = pc_current + 32'd4;

//==========================================================
// Instruction Memory
//==========================================================

instruction_memory IMEM(

    .address(pc_current),
    .instruction(instruction)

);

//==========================================================
// IF/ID Register
//==========================================================

if_id IF_ID(

    .clk(clk),
    .reset(reset),
    .enable(1'b1),
    .flush(1'b0),

    .pc_in(pc_current),
    .instruction_in(instruction),

    .pc_out(if_pc),
    .instruction_out(if_instruction)

);

//==========================================================
// Decoder
//==========================================================

decoder DEC(

    .instruction(if_instruction),

    .opcode(opcode),
    .rd(rd),
    .funct3(funct3),
    .rs1(rs1),
    .rs2(rs2),
    .funct7(funct7)

);

//==========================================================
// Control Unit
//==========================================================

control_unit CU(

    .opcode(opcode),

    .RegWrite(RegWrite),
    .MemRead(MemRead),
    .MemWrite(MemWrite),
    .MemtoReg(MemtoReg),
    .ALUSrc(ALUSrc),
    .Branch(Branch),
    .Jump(Jump),
    .ALUOp(ALUOp)

);

//==========================================================
// Register File
//==========================================================

register_file RF(

    .clk(clk),
    .we(RegWrite),

    .rs1(rs1),
    .rs2(rs2),
    .rd(rd),

    .write_data(writeback_data),

    .read_data1(read_data1),
    .read_data2(read_data2)

);

//==========================================================
// Immediate Generator
//==========================================================

immediate_generator IMM(

    .instruction(if_instruction),
    .immediate(immediate)

);

//==========================================================
// ALU Control
//==========================================================

alu_control ALUCTRL(

    .ALUOp(ALUOp),
    .funct3(funct3),
    .funct7(funct7),

    .alu_control(alu_ctrl_signal)

);

//==========================================================
// ALU
//==========================================================

assign alu_input_b = (ALUSrc) ? immediate : read_data2;

alu ALU(

    .a(read_data1),
    .b(alu_input_b),

    .alu_control(alu_ctrl_signal),

    .result(alu_result),
    .zero(zero)

);

//==========================================================
// Temporary Write Back
//==========================================================

assign writeback_data = alu_result;

//==========================================================
// Debug
//==========================================================

always @(posedge clk) begin

    $display("-----------------------------------------");
    $display("PC          = %h", pc_current);
    $display("Instruction = %h", if_instruction);
    $display("Opcode      = %b", opcode);
    $display("RD          = %0d", rd);
    $display("RS1         = %0d", rs1);
    $display("RS2         = %0d", rs2);
    $display("Immediate   = %0d", immediate);
    $display("ALU Result  = %0d", alu_result);

end

endmodule