`timescale 1ns / 1ps

module cpu_top(

    input logic clk,
    input logic reset,

    output logic [31:0] pc_debug,
    output logic [31:0] instruction_debug

);

    //==========================
    // Internal Signals
    //==========================

    logic [31:0] pc_current;
    logic [31:0] pc_next;

    logic [31:0] instruction;
    logic [31:0] immediate;

    logic [6:0] opcode;
    logic [4:0] rd;
    logic [4:0] rs1;
    logic [4:0] rs2;
    logic [2:0] funct3;
    logic [6:0] funct7;

    logic RegWrite;
    logic MemRead;
    logic MemWrite;
    logic MemtoReg;
    logic ALUSrc;
    logic Branch;
    logic Jump;

    logic [1:0] ALUOp;
    logic [3:0] alu_control;

    logic [31:0] read_data1;
    logic [31:0] read_data2;

    logic [31:0] alu_input_b;
    logic [31:0] alu_result;

    logic zero;

    //==========================
    // Program Counter
    //==========================

    pc pc_inst(

        .clk(clk),
        .reset(reset),
        .enable(1'b1),
        .pc_next(pc_next),
        .pc_current(pc_current)

    );

    assign pc_next = pc_current + 32'd4;

    //==========================
    // Instruction Memory
    //==========================

    instruction_memory imem(

        .address(pc_current),
        .instruction(instruction)

    );

    //==========================
    // Decoder
    //==========================

    decoder decoder_inst(

        .instruction(instruction),

        .opcode(opcode),
        .rd(rd),
        .funct3(funct3),
        .rs1(rs1),
        .rs2(rs2),
        .funct7(funct7)

    );

    //==========================
    // Control Unit
    //==========================

    control_unit cu(

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

    //==========================
    // Immediate Generator
    //==========================

    immediate_generator imm_gen(

        .instruction(instruction),
        .immediate(immediate)

    );

    //==========================
    // Register File
    //==========================

    register_file rf(

        .clk(clk),
        .we(RegWrite),

        .rs1(rs1),
        .rs2(rs2),
        .rd(rd),

        .write_data(alu_result),

        .read_data1(read_data1),
        .read_data2(read_data2)

    );

    //==========================
    // ALU Control
    //==========================

    alu_control alu_ctrl_inst(

        .ALUOp(ALUOp),
        .funct3(funct3),
        .funct7(funct7),

        .alu_control(alu_control)

    );

    //==========================
    // ALU Input Selection
    //==========================

    assign alu_input_b = (ALUSrc) ? immediate : read_data2;

    //==========================
    // ALU
    //==========================

    alu alu_inst(

        .a(read_data1),
        .b(alu_input_b),

        .alu_control(alu_control),

        .result(alu_result),
        .zero(zero)

    );

    //==========================
    // Debug Outputs
    //==========================

    assign pc_debug = pc_current;
    assign instruction_debug = instruction;

endmodule